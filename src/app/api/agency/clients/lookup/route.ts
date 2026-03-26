import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, forbidden, notFound, badRequest } from "@/lib/error-handler";

/**
 * GET /api/agency/clients/lookup?email=... — find a business by owner email
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  // Only agency owner/admin can look up clients
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  let agencyId = agency?.id;

  if (!agencyId) {
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id, role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .single();

    agencyId = membership?.agency_id;
  }

  if (!agencyId) {
    return forbidden("Not authorized");
  }

  const email = request.nextUrl.searchParams.get("email");
  if (!email?.trim()) {
    return badRequest("Email parameter is required");
  }

  // Find the user by email
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!targetUser) {
    return notFound("No user found with that email");
  }

  // Find their business
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, location_city, location_state, agency_id")
    .eq("user_id", targetUser.id)
    .single();

  if (!business) {
    return NextResponse.json({ business: null });
  }

  if (business.agency_id && business.agency_id !== agencyId) {
    return NextResponse.json(
      { error: "This business already belongs to another agency" },
      { status: 409 }
    );
  }

  if (business.agency_id === agencyId) {
    return NextResponse.json(
      { error: "This business is already in your agency" },
      { status: 409 }
    );
  }

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
      type: business.type,
    },
  });
}
