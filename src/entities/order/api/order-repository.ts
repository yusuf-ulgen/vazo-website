import { getSupabase, isSupabaseConfigured, isStorefrontMockEnabled } from '@/shared/lib/supabase';
import { formatErrorMessage } from '@/shared/utils/error-translator';
import {
  Order,
  CheckoutQuoteRequest,
  CheckoutQuoteResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  PayTRTokenResponse,
  PaymentResumeEligibility,
} from '../types';
import { shippingRepository } from '@/entities/shipping/api/shipping-repository';

// In-memory mock storage for local development & mock testing mode
const mockOrders: Order[] = [];

export const orderRepository = {
  /**
   * Fetches an authoritative checkout quote for the customer's cart.
   */
  async getQuote(request: CheckoutQuoteRequest): Promise<CheckoutQuoteResponse> {
    if (isStorefrontMockEnabled) {
      return this._simulateLocalQuote(request);
    }

    if (!isSupabaseConfigured) {
      throw new Error(
        'Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.'
      );
    }

    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    const { data, error } = await client.rpc('calculate_checkout_quote', {
      p_customer_id: user?.id || null,
      p_channel: request.channel || 'retail',
      p_currency: request.currency || 'TRY',
      p_destination_country: (request.destination_country || 'TR').toUpperCase(),
      p_items: request.items,
    });

    if (error) {
      throw new Error(`Fiyat hesaplanamadı: ${error.message}`);
    }

    return data as CheckoutQuoteResponse;
  },

  /**
   * Creates an order atomically in the database with inventory reservation and legal snapshots.
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    if (!request.accepted_preliminary_info || !request.accepted_distance_sales) {
      throw new Error(
        'Sipariş oluşturmak için Ön Bilgilendirme Koşulları ve Mesafeli Satış Sözleşmesi onaylanmalıdır.'
      );
    }

    if (isStorefrontMockEnabled) {
      return this._simulateLocalOrderCreation(request);
    }

    if (!isSupabaseConfigured) {
      throw new Error(
        'Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.'
      );
    }

    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw new Error('Sipariş oluşturmak için müşteri girişi zorunludur.');
    }

    const targetCountry = (
      request.destination_country || request.shipping_address.country_code
    ).toUpperCase();

    const { data, error } = await client.rpc('create_checkout_order', {
      p_customer_id: user.id,
      p_channel: request.channel || 'retail',
      p_currency: request.currency || 'TRY',
      p_destination_country: targetCountry,
      p_shipping_address: request.shipping_address,
      p_billing_address: request.billing_address || request.shipping_address,
      p_items: request.items,
      p_legal_consent: {
        preliminary_info_accepted: Boolean(request.accepted_preliminary_info),
        distance_sales_accepted: Boolean(request.accepted_distance_sales),
        kvkk_accepted: true,
      },
    });

    if (error) {
      throw new Error(formatErrorMessage('Sipariş oluşturulamadı', error));
    }

    return data as CreateOrderResponse;
  },

  /**
   * Fetches customer's orders history via Supabase RLS.
   */
  async getCustomerOrders(): Promise<Order[]> {
    if (isStorefrontMockEnabled) {
      return [...mockOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (!isSupabaseConfigured) {
      throw new Error(
        'Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.'
      );
    }

    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await client
      .from('orders')
      .select(
        `
        *,
        items:order_items(*)
      `
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[orderRepository.getCustomerOrders] Error:', error.message);
      throw new Error(formatErrorMessage('Siparişler yüklenemedi', error));
    }

    return (data || []) as Order[];
  },

  /**
   * Fetches a single order by ID with item snapshots and tracking information.
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    if (!orderId) return null;

    if (isStorefrontMockEnabled) {
      const found = mockOrders.find((o) => o.id === orderId || o.order_number === orderId);
      return found || null;
    }

    if (!isSupabaseConfigured) {
      throw new Error(
        'Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.'
      );
    }

    const client = getSupabase();
    const { data, error } = await client
      .from('orders')
      .select(
        `
        *,
        items:order_items(*)
      `
      )
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      console.error('[orderRepository.getOrderById] Error:', error.message);
      throw new Error(formatErrorMessage('Sipariş detayları yüklenemedi', error));
    }

    return (data as Order) || null;
  },

  /**
   * Local deterministic simulator for test suites and mock mode.
   */
  async _simulateLocalQuote(request: CheckoutQuoteRequest): Promise<CheckoutQuoteResponse> {
    const destinationCountry = (request.destination_country || 'TR').toUpperCase();
    const channel = request.channel || 'retail';
    const currency = request.currency || 'TRY';

    let subtotalMinor = 0;
    const items = request.items.map((item, idx) => {
      const unitPriceMinor = 150000; // 1.500,00 TRY baseline mock
      const lineTotalMinor = unitPriceMinor * item.quantity;
      subtotalMinor += lineTotalMinor;

      return {
        variant_id: item.variant_id,
        product_id: `mock-prod-${idx + 1}`,
        product_name: `Vazo Studio Tasarım Serisi #${idx + 1}`,
        variant_name: 'Standart / Mat Krem',
        sku: `VZ-SKU-00${idx + 1}`,
        image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800',
        unit_price_minor: unitPriceMinor,
        quantity: item.quantity,
        line_total_minor: lineTotalMinor,
      };
    });

    const shippingRes = await shippingRepository.resolveShipping({
      country_code: destinationCountry,
      channel,
      subtotal_minor: subtotalMinor,
      currency,
    });

    const shippingMinor = shippingRes.shipping_minor;
    const totalMinor = subtotalMinor + shippingMinor;
    const taxIncludedMinor = Math.round((totalMinor * 20) / 120);

    return {
      supported: shippingRes.supported,
      channel,
      currency,
      destination_country: destinationCountry,
      items,
      subtotal_minor: subtotalMinor,
      shipping_minor: shippingMinor,
      free_shipping_applied: shippingRes.free_shipping_applied,
      estimated_delivery_text: shippingRes.estimated_delivery_text || null,
      discount_minor: 0,
      tax_included: true,
      tax_rate: 20,
      tax_included_minor: taxIncludedMinor,
      total_minor: totalMinor,
    };
  },

  /**
   * Local deterministic simulator for order creation in mock mode.
   */
  async _simulateLocalOrderCreation(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const quote = await this._simulateLocalQuote(request);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `VZ-${dateStr}-${randomSuffix}`;
    const orderId = `order-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 40 * 60 * 1000).toISOString();
    let userEmail = '';
    try {
      const client = getSupabase();
      if (client?.auth) {
        const { data } = await client.auth.getUser();
        userEmail = data?.user?.email || '';
      }
    } catch {
      // ignore
    }

    const createdOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_id: 'mock-customer-id',
      channel: request.channel || 'retail',
      status: 'pending_payment',
      currency: quote.currency,
      tax_included: true,
      subtotal_minor: quote.subtotal_minor,
      shipping_minor: quote.shipping_minor,
      discount_minor: 0,
      tax_included_minor: quote.tax_included_minor,
      total_minor: quote.total_minor,
      shipping_address: request.shipping_address,
      billing_address: request.billing_address || request.shipping_address,
      customer_legal_snapshot: {
        customer_name: request.shipping_address?.recipient_name || '',
        email: userEmail || (request.shipping_address as unknown as Record<string, unknown>)?.email || '',
        phone: request.shipping_address?.phone || '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: quote.items.map((item, idx) => ({
        id: `oi-${idx}-${Date.now()}`,
        order_id: orderId,
        product_id: item.product_id,
        variant_id: item.variant_id,
        sku_snapshot: item.sku,
        product_name_snapshot: item.product_name,
        variant_name_snapshot: item.variant_name,
        image_url_snapshot: item.image_url,
        unit_price_minor: item.unit_price_minor,
        quantity: item.quantity,
        line_total_minor: item.line_total_minor,
        currency: quote.currency,
        channel: quote.channel,
        metadata_snapshot: {},
        created_at: new Date().toISOString(),
      })),
    };

    mockOrders.push(createdOrder);

    return {
      order_id: orderId,
      order_number: orderNumber,
      status: 'pending_payment',
      subtotal_minor: quote.subtotal_minor,
      shipping_minor: quote.shipping_minor,
      total_minor: quote.total_minor,
      currency: quote.currency,
      expires_at: expiresAt,
      payment_timeout_minutes: 30,
      reservation_timeout_minutes: 40,
    };
  },

  /**
   * Generates a PayTR Inline iFrame token for the given order.
   */
  async getPayTRToken(orderId: string): Promise<PayTRTokenResponse> {
    if (!orderId) {
      throw new Error('Sipariş kimliği (orderId) zorunludur.');
    }

    if (isStorefrontMockEnabled) {
      return this._simulateLocalPayTRToken(orderId);
    }

    if (!isSupabaseConfigured) {
      throw new Error(
        'Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.'
      );
    }

    const client = getSupabase();
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session) {
      throw new Error('Ödeme başlatmak için müşteri oturumu zorunludur.');
    }

    const { data, error } = await client.functions.invoke('create-paytr-token', {
      body: { order_id: orderId },
    });

    if (error) {
      console.error('[orderRepository.getPayTRToken] Edge function error:', error);
      throw new Error(formatErrorMessage('Ödeme başlatılamadı', error));
    }

    if (!data || !data.token) {
      throw new Error(data?.error || 'Ödeme oturumu alınamadı.');
    }

    return data as PayTRTokenResponse;
  },

  /**
   * Evaluates server authority for whether an order can safely resume payment.
   */
  async getPaymentResumeEligibility(orderId: string): Promise<PaymentResumeEligibility> {
    if (!orderId) {
      return {
        eligible: false,
        reason: 'Geçersiz sipariş kimliği.',
        code: 'ORDER_NOT_FOUND',
      };
    }

    if (isStorefrontMockEnabled) {
      return this._simulateLocalResumeEligibility(orderId);
    }

    if (!isSupabaseConfigured) {
      throw new Error(
        'Aktif veritabanı bağlantısı bulunamadı. Canlı mod geçerli Supabase ortam değişkenlerini gerektirir.'
      );
    }

    const client = getSupabase();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return {
        eligible: false,
        is_owner: false,
        reason: 'Ödemeye devam etmek için giriş yapmanız gerekmektedir.',
        code: 'FORBIDDEN',
      };
    }

    const { data, error } = await client.rpc('check_payment_resume_eligibility', {
      p_order_id: orderId,
      p_customer_id: user.id,
    });

    if (error) {
      console.error('[orderRepository.getPaymentResumeEligibility] RPC error:', error.message);
      return {
        eligible: false,
        reason: error.message,
      };
    }

    return (data as PaymentResumeEligibility) || {
      eligible: false,
      reason: 'Hazırlık durumu değerlendirilemedi.',
    };
  },

  _simulateLocalResumeEligibility(orderId: string): PaymentResumeEligibility {
    const order = mockOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (!order) {
      return {
        eligible: false,
        reason: 'Sipariş bulunamadı.',
        code: 'ORDER_NOT_FOUND',
      };
    }

    if (order.status === 'paid') {
      return {
        eligible: false,
        is_owner: true,
        status: order.status,
        reason: 'Bu siparişin ödemesi zaten tamamlanmıştır.',
        code: 'ALREADY_PAID',
      };
    }

    if (order.status === 'cancelled') {
      return {
        eligible: false,
        is_owner: true,
        status: order.status,
        reason: 'Bu sipariş iptal edilmiştir.',
        code: 'ORDER_CANCELLED',
      };
    }

    if (order.status !== 'pending_payment') {
      return {
        eligible: false,
        is_owner: true,
        status: order.status,
        reason: 'Sipariş ödeme aşamasında değil.',
        code: 'INVALID_STATUS',
      };
    }

    return {
      eligible: true,
      is_owner: true,
      is_expired: false,
      status: order.status,
      order_id: order.id,
      order_number: order.order_number,
      subtotal_minor: order.subtotal_minor,
      shipping_minor: order.shipping_minor,
      total_minor: order.total_minor,
      currency: order.currency,
      order,
    };
  },

  /**
   * Local deterministic simulator for PayTR token in mock mode.
   * Enforces the same customer data integrity invariants (no dummy data).
   */
  async _simulateLocalPayTRToken(orderId: string): Promise<PayTRTokenResponse> {
    const order = mockOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (order) {
      let authUserEmail = '';
      try {
        const client = getSupabase();
        if (client?.auth) {
          const { data } = await client.auth.getUser();
          authUserEmail = data?.user?.email || '';
        }
      } catch {
        // ignore
      }
      const legalSnapshot = (order.customer_legal_snapshot || {}) as Record<string, unknown>;
      const shippingRecord = (order.shipping_address || {}) as unknown as Record<string, unknown>;
      const email = String(legalSnapshot.email || shippingRecord.email || authUserEmail || '');
      if (!email || email.includes('musteri@vazostudio.com') || email.includes('placeholder') || email === 'test@test.com') {
        throw new Error('Geçerli bir müşteri e-posta adresi zorunludur. Lütfen profilinizdeki e-posta adresinizi doğrulayın.');
      }
      const name = String(order.shipping_address?.recipient_name || legalSnapshot.customer_name || '');
      if (!name || name === 'Müşteri' || name === 'Değerli Müşterimiz' || name.length < 2) {
        throw new Error('Teslimat için geçerli bir alıcı ad-soyad bilgisi zorunludur. Lütfen adresinizi güncelleyin.');
      }
      const phone = String(order.shipping_address?.phone || legalSnapshot.phone || '').replace(/\D/g, '');
      if (!phone || phone.length < 10 || phone === '5550000000') {
        throw new Error('Teslimat ve SMS bilgilendirmesi için geçerli bir telefon numarası zorunludur. Lütfen adresinizdeki telefon bilgisini güncelleyin.');
      }
    }

    const mockToken = `mock_paytr_token_${orderId}_${Date.now().toString(36)}`;
    const merchantOid = `VZMOCK${Date.now().toString(36).toUpperCase()}`;

    return {
      success: true,
      token: mockToken,
      iframe_url: `https://www.paytr.com/odeme/guvenli/${mockToken}`,
      merchant_oid: merchantOid,
      is_test_mode: true,
    };
  },
};

