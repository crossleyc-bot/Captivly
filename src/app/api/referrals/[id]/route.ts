import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, notFound, badRequest } from "@/lib/error-handler";

/**
 * PATCH /api/referrals/[id] — toggle referral link active status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return notFound("No business found");
  }

  const body = (await request.json()) as { is_active?: boolean };

  if (typeof body.is_active !== "boolean") {
    return badRequest("is_active (boolean) is required");
  }

  // Ensure the link belongs to the user's business
  const { data: link, error } = await supabase
    .from("referral_links")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .eq("business_id", business.id)
    .select()
    .single();

  if (error || !link) {
    return notFound("Referral link not found");
  }

  return NextResponse.json({ link });
}
