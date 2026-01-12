import { vi } from "vitest";

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.NIGHTFALL_API_KEY = "test-nightfall-key";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.GOOGLE_CLOUD_PROJECT = "test-project";
process.env.GOOGLE_KMS_KEYRING = "test-keyring";
process.env.GOOGLE_KMS_KEY = "test-key";

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testHelpers: {
    mockDate: (date: Date) => void;
    restoreDate: () => void;
  };
}

const originalDate = Date;

globalThis.testHelpers = {
  mockDate: (date: Date) => {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  },
  restoreDate: () => {
    vi.useRealTimers();
  },
};
