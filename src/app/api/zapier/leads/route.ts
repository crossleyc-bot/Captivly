import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key-auth";
import { getServiceClient } from "@/lib/supabase/service";
import { notFound, internalError } from "@/lib/error-handler";

/**
 * Zapier polling trigger: returns recent leads for the authenticated user's business.
 *
 * Query params:
 *   - status: filter by lead status (optional)
 *   - since: ISO timestamp, only return leads created after this time (optional)
 *   - limit: max results, default 20 (optional)
 *
 * Zapier polls this endpoint periodically and triggers zaps for new items.
 */
export async function GET(request: NextRequest) {
  const authResult = await validateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = getServiceClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", authResult.userId)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const since = params.get("since");
  const limit = Math.min(parseInt(params.get("limit") ?? "20") || 20, 100);

  let query = supabase
    .from("leads")
    .select(
      "id, first_name, last_name, email, phone, ai_score, ai_score_reason, status, source, created_at, updated_at"
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (since) {
    query = query.gt("created_at", since);
  }

  const { data: leads, error } = await query;

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json(leads ?? []);
}
