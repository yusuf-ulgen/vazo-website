import { vi } from 'vitest';
import { handleMockRpc } from './supabase-mock-rpc';

export interface MockSupabaseResponse<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

let activeMockState: Record<string, Record<string, unknown>[]> = {};

export function getMockState(): Record<string, Record<string, unknown>[]> {
  return activeMockState;
}

export function createMockSupabaseClient(tableResponses: Record<string, MockSupabaseResponse> = {}) {
  const state: Record<string, Record<string, unknown>[]> = {};
  for (const [table, res] of Object.entries(tableResponses)) {
    state[table] = Array.isArray(res.data)
      ? res.data.map((item) => (typeof item === 'object' && item !== null ? { ...(item as Record<string, unknown>) } : { val: item }))
      : (res.data && typeof res.data === 'object' ? [{ ...(res.data as Record<string, unknown>) }] : []);
  }

  activeMockState = state;

  const client = {
    __state: state,
    from: vi.fn().mockImplementation((tableName: string) => {
      if (!state[tableName]) {
        state[tableName] = [];
      }
      const tableData = state[tableName];
      const tableError = tableResponses[tableName]?.error || null;

      let currentData = [...tableData];
      if (tableName === 'menu_groups') {
        currentData = tableData.map((group) => ({
          ...group,
          items: group.items || (state['menu_items'] || []).filter((i) => i.group_id === group.id),
          menu_items: group.menu_items || (state['menu_items'] || []).filter((i) => i.group_id === group.id),
        }));
      } else if (tableName === 'faq_groups') {
        currentData = tableData.map((group) => ({
          ...group,
          items: group.items || (state['faq_items'] || []).filter((i) => i.group_id === group.id),
          faq_items: group.faq_items || (state['faq_items'] || []).filter((i) => i.group_id === group.id),
        }));
      }

      let singleMode = false;
      let isDelete = false;
      let updatePayload: Record<string, unknown> | null = null;
      let insertedItem: Record<string, unknown> | null = null;

      const queryBuilder: Record<string, unknown> = {};
      const chain = () => queryBuilder;

      queryBuilder.select = vi.fn().mockImplementation(() => chain());

      queryBuilder.insert = vi.fn().mockImplementation((payload: Record<string, unknown> | Record<string, unknown>[]) => {
        const items = Array.isArray(payload) ? payload : [payload];
        for (const item of items) {
          const matchingPreset = Array.isArray(tableResponses[tableName]?.data)
            ? (tableResponses[tableName]?.data as Record<string, unknown>[]).find(
                (d) => item.slug && d.slug === item.slug && d.id
              )
            : null;

          const newItem: Record<string, unknown> = {
            id: item.id || matchingPreset?.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          };
          tableData.push(newItem);
          insertedItem = newItem;
        }
        currentData = insertedItem ? [insertedItem] : [];
        return chain();
      });

      queryBuilder.update = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        updatePayload = payload;
        return chain();
      });

      queryBuilder.delete = vi.fn().mockImplementation(() => {
        isDelete = true;
        return chain();
      });

      queryBuilder.upsert = vi.fn().mockImplementation((payload: Record<string, unknown> | Record<string, unknown>[]) => {
        const items = Array.isArray(payload) ? payload : [payload];
        for (const item of items) {
          const idx = tableData.findIndex((d) =>
            (item.id && d.id === item.id) || (item.key && d.key === item.key)
          );
          if (idx >= 0) {
            tableData[idx] = { ...tableData[idx], ...item, updated_at: new Date().toISOString() };
            insertedItem = tableData[idx] || null;
          } else {
            const newItem: Record<string, unknown> = {
              id: item.id || `mock-${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...item,
            };
            tableData.push(newItem);
            insertedItem = newItem;
          }
        }
        currentData = [...tableData];
        return chain();
      });

      queryBuilder.eq = vi.fn().mockImplementation((column: string, val: unknown) => {
        if (isDelete) {
          for (let i = tableData.length - 1; i >= 0; i--) {
            if (tableData[i]?.[column] === val) {
              tableData.splice(i, 1);
            }
          }
        }
        if (updatePayload) {
          for (let i = 0; i < tableData.length; i++) {
            if (tableData[i]?.[column] === val) {
              tableData[i] = { ...tableData[i], ...updatePayload, updated_at: new Date().toISOString() };
              insertedItem = tableData[i] || null;
            }
          }
        }
        currentData = currentData.filter((item) => {
          if (column === 'product_categories.category_id') {
            const categories = item.product_categories as Array<Record<string, unknown>> | undefined;
            return categories?.some((pc) => pc.category_id === val) ?? true;
          }
          if (column === 'product_collections.collection_id') {
            const collections = item.product_collections as Array<Record<string, unknown>> | undefined;
            return collections?.some((pc) => pc.collection_id === val) ?? true;
          }
          if (item[column] === val) return true;
          if (column === 'active' && val === true && item.active === undefined) return true;
          if (column === 'status' && val === 'published' && item.status === undefined) return true;
          if (column === 'is_featured' && (item.is_featured === val || item.featured === val || (item.is_featured === undefined && item.featured === undefined))) return true;
          if (column === 'featured' && (item.featured === val || item.is_featured === val || (item.featured === undefined && item.is_featured === undefined))) return true;
          if (column === 'wholesale_enabled' && (item.wholesale_enabled === val || item.is_wholesale_enabled === val || (item.wholesale_enabled === undefined && item.is_wholesale_enabled === undefined))) return true;
          if (column === 'retail_enabled' && (item.retail_enabled === val || item.is_retail_enabled === val || (item.retail_enabled === undefined && item.is_retail_enabled === undefined))) return true;
          if (column === 'is_bestseller' && (item.is_bestseller === val || item.bestseller === val || (item.is_bestseller === undefined && item.bestseller === undefined))) return true;
          if (column === 'bestseller' && (item.bestseller === val || item.is_bestseller === val || (item.bestseller === undefined && item.is_bestseller === undefined))) return true;
          if (column === 'new_arrival' && (item.new_arrival === val || item.is_new_arrival === val || (item.new_arrival === undefined && item.is_new_arrival === undefined))) return true;
          if (column === 'menu_type' && (item.menu_type === val || item.menu_type === undefined)) return true;
          return false;
        });
        return chain();
      });

      queryBuilder.neq = vi.fn().mockImplementation((column: string, val: unknown) => {
        currentData = currentData.filter((item) => item[column] !== val);
        return chain();
      });

      queryBuilder.in = vi.fn().mockImplementation((column: string, values: unknown[]) => {
        currentData = currentData.filter((item) => values.includes(item[column]));
        return chain();
      });

      queryBuilder.ilike = vi.fn().mockImplementation((column: string, pattern: string) => {
        const rawPattern = pattern.replace(/%/g, '').toLowerCase();
        currentData = currentData.filter((item) =>
          String(item[column] || '').toLowerCase().includes(rawPattern)
        );
        return chain();
      });

      queryBuilder.like = vi.fn().mockImplementation((column: string, pattern: string) => {
        const rawPattern = pattern.replace(/%/g, '');
        currentData = currentData.filter((item) =>
          String(item[column] || '').includes(rawPattern)
        );
        return chain();
      });

      queryBuilder.range = vi.fn().mockImplementation((from: number, to: number) => {
        if (currentData.length > from) {
          currentData = currentData.slice(from, to + 1);
        }
        return chain();
      });

      queryBuilder.limit = vi.fn().mockImplementation((count: number) => {
        currentData = currentData.slice(0, count);
        return chain();
      });

      queryBuilder.order = vi.fn().mockImplementation(() => chain());
      queryBuilder.filter = vi.fn().mockImplementation(() => chain());
      queryBuilder.or = vi.fn().mockImplementation((orExpr: string) => {
        const clauses = orExpr.split(',').map((c) => c.trim().split('.'));
        currentData = currentData.filter((item) => {
          return clauses.some(([col, _op, pattern]) => {
            if (!col || !pattern) return false;
            const cleanPattern = pattern.replace(/%/g, '').toLowerCase();
            let val = '';
            if (col.includes('->>')) {
              const [parent, child] = col.split('->>');
              const parentObj = item[parent] as Record<string, unknown> | undefined;
              val = String(parentObj?.[child] || '').toLowerCase();
            } else {
              val = String(item[col] || '').toLowerCase();
            }
            return val.includes(cleanPattern);
          });
        });
        return chain();
      });
      queryBuilder.is = vi.fn().mockImplementation(() => chain());
      queryBuilder.gt = vi.fn().mockImplementation(() => chain());
      queryBuilder.gte = vi.fn().mockImplementation(() => chain());
      queryBuilder.lt = vi.fn().mockImplementation(() => chain());
      queryBuilder.lte = vi.fn().mockImplementation(() => chain());
      queryBuilder.contains = vi.fn().mockImplementation(() => chain());

      queryBuilder.single = vi.fn().mockImplementation(() => {
        singleMode = true;
        return queryBuilder;
      });

      queryBuilder.maybeSingle = vi.fn().mockImplementation(() => {
        singleMode = true;
        return queryBuilder;
      });

      queryBuilder.then = vi.fn().mockImplementation((onFulfilled: (res: { data: unknown; error: unknown; count: number }) => unknown) => {
        let resultData: unknown;
        if (singleMode) {
          resultData = insertedItem || (currentData[0] ?? null);
        } else {
          resultData = currentData;
        }

        const res = {
          data: resultData,
          error: tableError,
          count: currentData.length,
        };
        return Promise.resolve(res).then(onFulfilled);
      });

      return queryBuilder;
    }),
    rpc: vi.fn().mockImplementation((fnName: string, args?: Record<string, unknown>) =>
      handleMockRpc(state, fnName, args)
    ),
    functions: {
      invoke: vi.fn().mockImplementation((fnName: string, options?: { body?: Record<string, unknown> }) => {
        if (fnName === 'create-paytr-token') {
          const body = options?.body || {};
          const orderId = body.order_id as string;

          const commerce = (state['site_settings'] || []).find((s) => s.key === 'commerce');
          const isCheckoutEnabled = (commerce?.value as Record<string, unknown>)?.checkout_enabled !== false;
          if (!isCheckoutEnabled || body.simulateDisabledCheckout) {
            return Promise.resolve({
              data: null,
              error: { message: 'Ödeme ve sipariş sistemi şu anda kapalıdır.' },
            });
          }

          if (body.simulateMissingAppOrigin) {
            return Promise.resolve({
              data: null,
              error: { message: 'Sunucu yapılandırma hatası: APP_ORIGIN tanımlanmamış.' },
            });
          }

          if (body.simulatePaytrHttpError) {
            return Promise.resolve({
              data: null,
              error: { message: 'PayTR servisi ile iletişim kurulamadı.' },
            });
          }

          const orders = state['orders'] || [];
          const order = orders.find((o) => o.id === orderId);
          if (!order) {
            return Promise.resolve({ data: null, error: { message: 'Sipariş bulunamadı.' } });
          }

          if (body.simulateWrongOwner) {
            return Promise.resolve({
              data: null,
              error: { message: 'Bu siparişe erişim yetkiniz bulunmamaktadır.' },
            });
          }

          if (order.status !== 'pending_payment' || body.simulateWrongStatus) {
            return Promise.resolve({
              data: null,
              error: { message: `Sipariş ödeme aşamasında değil (Mevcut Durum: ${order.status}).` },
            });
          }

          if (order.is_expired) {
            return Promise.resolve({
              data: null,
              error: { message: 'Sipariş için ayrılan stok rezervasyon süresi dolmuştur.' },
            });
          }

          // Customer Data Integrity Validations
          const shippingAddr = (order.shipping_address as Record<string, unknown>) || {};
          const customerEmail = (order.customer_email as string) || (shippingAddr.email as string) || '';
          const customerName = (order.customer_name as string) || (shippingAddr.recipient_name as string) || '';
          const customerPhone = (order.customer_phone as string) || (shippingAddr.phone as string) || '';

          if (body.simulateInvalidEmail || !customerEmail || customerEmail.includes('musteri@vazostudio.com') || customerEmail.includes('placeholder') || customerEmail === 'test@test.com') {
            return Promise.resolve({
              data: null,
              error: { message: 'Geçerli bir müşteri e-posta adresi zorunludur. Lütfen profilinizdeki e-posta adresinizi doğrulayın.' },
            });
          }

          if (body.simulateInvalidName || !customerName || customerName === 'Müşteri' || customerName === 'Değerli Müşterimiz' || customerName.length < 2) {
            return Promise.resolve({
              data: null,
              error: { message: 'Teslimat için geçerli bir alıcı ad-soyad bilgisi zorunludur. Lütfen adresinizi güncelleyin.' },
            });
          }

          const cleanPhone = customerPhone.replace(/\D/g, '');
          if (body.simulateInvalidPhone || !cleanPhone || cleanPhone.length < 10 || cleanPhone === '5550000000') {
            return Promise.resolve({
              data: null,
              error: { message: 'Teslimat ve SMS bilgilendirmesi için geçerli bir telefon numarası zorunludur. Lütfen adresinizdeki telefon bilgisini güncelleyin.' },
            });
          }

          const addressLine = (shippingAddr.address_line1 as string) || '';
          const city = (shippingAddr.city as string) || '';
          if (body.simulateInvalidAddress || !addressLine || addressLine.length < 5 || !city) {
            return Promise.resolve({
              data: null,
              error: { message: 'Geçerli ve açık bir teslimat adresi zorunludur. Lütfen adres bilgilerinizi eksiksiz doldurun.' },
            });
          }

          return Promise.resolve({
            data: {
              success: true,
              token: `mock_token_${orderId}`,
              iframe_url: `https://www.paytr.com/odeme/guvenli/mock_token_${orderId}`,
              merchant_oid: `VZ${Date.now()}`,
              is_test_mode: true,
            },
            error: null,
          });
        }
        if (fnName === 'paytr-refund') {
          const body = options?.body || {};
          const paymentId = body.payment_id as string;
          const refundAmount = (body.refund_amount_minor as number) || 0;
          const idempotencyKey = (body.idempotency_key as string) || '';

          if (body.simulateMissingSecrets) {
            return Promise.resolve({
              data: { success: false, error: 'PayTR yapılandırması eksik. İade işlemi gerçekleştirilemez.', error_code: 'CONFIGURATION_ERROR' },
              error: { message: 'PayTR yapılandırması eksik. İade işlemi gerçekleştirilemez.' },
            });
          }

          if (body.simulateTimeout) {
            return Promise.resolve({
              data: { success: false, error: 'PayTR iade servisine bağlanırken 15 saniyelik zaman aşımı oluştu.', error_code: 'PROVIDER_TIMEOUT' },
              error: { message: 'PayTR iade servisine bağlanırken 15 saniyelik zaman aşımı oluştu.' },
            });
          }

          if (body.simulateNetworkError) {
            return Promise.resolve({
              data: { success: false, error: 'PayTR ağına bağlanılamadı.', error_code: 'NETWORK_ERROR' },
              error: { message: 'PayTR ağına bağlanılamadı.' },
            });
          }

          if (body.simulateMalformedResponse) {
            return Promise.resolve({
              data: { success: false, error: 'Geçersiz sağlayıcı yanıtı: <html>Bad Gateway</html>', error_code: 'MALFORMED_PROVIDER_RESPONSE' },
              error: null,
            });
          }

          if (body.simulateProviderReject) {
            return Promise.resolve({
              data: { success: false, error: 'PayTR: Yetersiz bakiye veya işlem reddedildi.', error_code: 'PROVIDER_REJECTED' },
              error: null,
            });
          }

          const payments = state['payments'] || [];
          const payment = payments.find((p) => p.id === paymentId);
          if (!payment) {
            return Promise.resolve({ data: null, error: { message: 'Ödeme kaydı bulunamadı.' } });
          }

          if (refundAmount <= 0 || !Number.isInteger(refundAmount)) {
            return Promise.resolve({
              data: { success: false, error: 'İade tutarı 0\'dan büyük bir tamsayı kuruş değeri olmalıdır.' },
              error: null,
            });
          }

          const expected = (payment.expected_amount_minor as number) || 0;
          const refunded = (payment.refunded_amount_minor as number) || 0;
          const remaining = expected - refunded;
          if (refundAmount > remaining) {
            return Promise.resolve({
              data: { success: false, error: 'İade tutarı kalan iade edilebilir bakiyeyi aşamaz.' },
              error: null,
            });
          }

          // Check idempotency in mock state
          const refunds = state['refunds'] || (state['refunds'] = []);
          const existing = refunds.find((r) => r.request_id === idempotencyKey && idempotencyKey !== '');
          if (existing) {
            if (existing.status === 'succeeded') {
              return Promise.resolve({
                data: {
                  success: true,
                  already_finalized: true,
                  refund_id: existing.id,
                  reference_no: existing.reference_no,
                  status: 'succeeded',
                },
                error: null,
              });
            }
            if (existing.status === 'pending') {
              return Promise.resolve({
                data: null,
                error: { message: 'Bu iade talebi zaten işleme alınmış ve devam ediyor.' },
              });
            }
          }

          const refundId = `ref-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const refNo = `RF${Date.now()}`;

          // Financial records update strictly upon verified success
          payment.refunded_amount_minor = refunded + refundAmount;
          const newStatus = payment.refunded_amount_minor >= expected ? 'refunded' : 'partially_refunded';
          payment.status = newStatus;
          const orders = state['orders'] || [];
          const order = orders.find((o) => o.id === payment.order_id);
          if (order) {
            order.status = newStatus;
          }

          refunds.push({
            id: refundId,
            payment_id: paymentId,
            request_id: idempotencyKey,
            reference_no: refNo,
            amount_minor: refundAmount,
            status: 'succeeded',
          });

          return Promise.resolve({
            data: {
              success: true,
              refund_id: refundId,
              reference_no: refNo,
              status: 'succeeded',
            },
            error: null,
          });
        }
        return Promise.resolve({ data: { success: true }, error: null });
      }),
    },
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-1', email: 'admin@vazostudio.com' }, session: { access_token: 'mock-token' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-1', email: 'admin@vazostudio.com' } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'uploads/test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/uploads/test.jpg' } }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
  };

  return client;
}


