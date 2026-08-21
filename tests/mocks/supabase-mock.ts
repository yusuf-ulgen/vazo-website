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

  queryBuilder.single = vi.fn().mockResolvedValue(response);
  queryBuilder.maybeSingle = vi.fn().mockResolvedValue(response);
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
  };
}
