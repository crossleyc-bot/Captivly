import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-key-auth";
import { getServiceClient } from "@/lib/supabase/service";
import { notFound, internalError } from "@/lib/error-handler";

/**
 * Zapier polling trigger: returns recent conversions.
 *
 * Query params:
 *   - since: ISO timestamp (optional)
 *   - limit: max results, default 20 (optional)
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
  const since = params.get("since");
  const limit = Math.min(parseInt(params.get("limit") ?? "20") || 20, 100);

  let query = supabase
    .from("conversions")
    .select("id, lead_id, type, notes, converted_at")
    .eq("business_id", business.id)
    .order("converted_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("converted_at", since);
  }

  const { data: conversions, error } = await query;

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json(conversions ?? []);
}
