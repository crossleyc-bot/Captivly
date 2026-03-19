import { vi } from "vitest";

/** Shared environment variable stubs for all test files. */
export function stubTestEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  vi.stubEnv("META_VERIFY_TOKEN", "captivly_webhook_secret");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("INTERNAL_API_SECRET", "test-internal-secret");
  vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  vi.stubEnv("STRIPE_PRICE_STARTER", "price_starter");
  vi.stubEnv("STRIPE_PRICE_GROWTH", "price_growth");
  vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
}
