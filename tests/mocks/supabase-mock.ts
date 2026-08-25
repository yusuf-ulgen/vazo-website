import { vi } from 'vitest';

export interface MockSupabaseResponse<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export function createSupabaseQueryMock<T = unknown>(response: MockSupabaseResponse<T>) {
  const queryBuilder: Record<string, unknown> = {};

  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'order',
    'limit',
    'range',
    'filter',
    'or',
  ];

  methods.forEach((method) => {
    queryBuilder[method] = vi.fn().mockImplementation(() => queryBuilder);
  });

  const singleData = Array.isArray(response.data) ? (response.data[0] ?? null) : response.data;
  const singleResponse = {
    ...response,
    data: singleData,
  };

  queryBuilder.single = vi.fn().mockResolvedValue(singleResponse);
  queryBuilder.maybeSingle = vi.fn().mockResolvedValue(singleResponse);
  queryBuilder.then = vi.fn().mockImplementation((onFulfilled: (res: MockSupabaseResponse<T>) => unknown) => {
    return Promise.resolve(response).then(onFulfilled);
  });

  return queryBuilder;
}


export function createMockSupabaseClient(tableResponses: Record<string, MockSupabaseResponse>) {
  return {
    from: vi.fn().mockImplementation((tableName: string) => {
      const response = tableResponses[tableName] || { data: [], error: null };
      return createSupabaseQueryMock(response);
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      }),
    },
  };
}

