import { vi } from "vitest";

/**
 * Mock Supabase client for testing
 *
 * Usage in tests:
 * ```typescript
 * import { mockSupabase, resetMockSupabase } from '@/__mocks__/supabase';
 *
 * beforeEach(() => {
 *   resetMockSupabase();
 * });
 *
 * test('example', async () => {
 *   mockSupabase.single.mockResolvedValueOnce({ data: fixtures.user(), error: null });
 *   // ... test code
 * });
 * ```
 */

// Create chainable mock functions
const createChainableMock = () => {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = [
    "from",
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "is",
    "in",
    "contains",
    "containedBy",
    "order",
    "limit",
    "range",
    "match",
    "filter",
    "or",
    "and",
    "not",
    "textSearch",
  ];

  // Terminal operations that return data
  const terminals = ["single", "maybeSingle", "execute"];

  // Create all chainable methods
  chainable.forEach((method) => {
    mock[method] = vi.fn().mockReturnThis();
  });

  // Create terminal methods
  terminals.forEach((method) => {
    mock[method] = vi.fn().mockResolvedValue({ data: null, error: null });
  });

  // Make 'from' return the mock object to enable chaining
  mock.from = vi.fn().mockReturnValue(mock);

  return mock;
};

export const mockSupabase = createChainableMock();

// RPC mock
export const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
mockSupabase.rpc = mockRpc;

// Auth mock
export const mockAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getSession: vi
    .fn()
    .mockResolvedValue({ data: { session: null }, error: null }),
  signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
};
mockSupabase.auth = mockAuth;

// Storage mock
export const mockStorage = {
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: null, error: null }),
    download: vi.fn().mockResolvedValue({ data: null, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
};
mockSupabase.storage = mockStorage;

// Reset function to clear all mocks
export const resetMockSupabase = () => {
  Object.values(mockSupabase).forEach((mock) => {
    if (typeof mock === "function" && "mockClear" in mock) {
      (mock as ReturnType<typeof vi.fn>).mockClear();
    } else if (typeof mock === "object" && mock !== null) {
      Object.values(mock).forEach((nestedMock) => {
        if (typeof nestedMock === "function" && "mockClear" in nestedMock) {
          (nestedMock as ReturnType<typeof vi.fn>).mockClear();
        }
      });
    }
  });
};

// Helper to set up successful query responses
export const mockQuerySuccess = <T>(data: T) => ({
  data,
  error: null,
  count: Array.isArray(data) ? data.length : 1,
  status: 200,
  statusText: "OK",
});

// Helper to set up error responses
export const mockQueryError = (
  message: string,
  code = "PGRST116",
  status = 400
) => ({
  data: null,
  error: {
    message,
    code,
    details: null,
    hint: null,
  },
  count: null,
  status,
  statusText: "Bad Request",
});

// Export a factory for creating fresh mocks in tests
export const createMockSupabaseClient = () => {
  const client = createChainableMock();
  client.auth = { ...mockAuth };
  client.storage = { ...mockStorage };
  client.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  return client;
};
