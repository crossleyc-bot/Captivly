import { createClient } from "@supabase/supabase-js";

/**
 * Service role Supabase client — bypasses RLS.
 * Use only in server-to-server contexts: webhooks, cron jobs, internal API routes.
 * Never expose to client-side code.
 */
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
