import { vi } from 'vitest';

export interface MockSupabaseResponse<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

export function createMockSupabaseClient(tableResponses: Record<string, MockSupabaseResponse> = {}) {
  const state: Record<string, Record<string, unknown>[]> = {};
  for (const [table, res] of Object.entries(tableResponses)) {
    state[table] = Array.isArray(res.data)
      ? res.data.map((item) => (typeof item === 'object' && item !== null ? { ...(item as Record<string, unknown>) } : { val: item }))
      : (res.data && typeof res.data === 'object' ? [{ ...(res.data as Record<string, unknown>) }] : []);
  }

  const client = {
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
            const val = String(item[col] || '').toLowerCase();
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
    rpc: vi.fn().mockImplementation((fnName: string, args: Record<string, unknown>) => {
      if (fnName === 'log_admin_audit_event' && args) {
        if (!state['admin_audit_logs']) state['admin_audit_logs'] = [];
        state['admin_audit_logs'].unshift({
          id: `audit-${Date.now()}`,
          action: args.p_action,
          entity_type: args.p_entity_type,
          entity_id: args.p_entity_id,
          entity_name: args.p_entity_name,
          safe_metadata: args.p_safe_metadata || args.p_metadata || null,
          created_at: new Date().toISOString(),
        });
      }
      return Promise.resolve({ data: true, error: null });
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
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


