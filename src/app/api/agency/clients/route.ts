import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, forbidden, notFound, badRequest, internalError } from "@/lib/error-handler";

/**
 * GET /api/agency/clients — list businesses managed by this agency
 * POST /api/agency/clients — add a business to the agency
 */

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  // Get agency (as owner or member)
  const agencyId = await getAgencyId(supabase, user.id);
  if (!agencyId) {
    return notFound("No agency found");
  }

  const { data: clients } = await supabase
    .from("businesses")
    .select("id, name, type, location_city, location_state, created_at, user:users(email, full_name)")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ clients: clients ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  // Only agency owner/admin can add clients
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  let agencyId = agency?.id;

  if (!agencyId) {
    // Check if admin
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

  const { business_id } = (await request.json()) as { business_id: string };

  if (!business_id) {
    return badRequest("business_id required");
  }

  // Verify the business belongs to the requesting user or one of their agency members
  const { data: business } = await supabase
    .from("businesses")
    .select("id, user_id")
    .eq("id", business_id)
    .single();

  if (!business) {
    return notFound("Business not found");
  }

  // Only the business owner themselves or a business whose owner is an agency member
  if (business.user_id !== user.id) {
    const { data: memberCheck } = await supabase
      .from("agency_members")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("user_id", business.user_id)
      .single();

    if (!memberCheck) {
      return forbidden("Business owner must be a member of the agency");
    }
  }

  const { error } = await supabase
    .from("businesses")
    .update({ agency_id: agencyId })
    .eq("id", business_id);

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json({ added: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  // Only agency owner/admin can remove clients
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

  const { business_id } = (await request.json()) as { business_id: string };

  if (!business_id) {
    return badRequest("business_id required");
  }

  const { error } = await supabase
    .from("businesses")
    .update({ agency_id: null })
    .eq("id", business_id)
    .eq("agency_id", agencyId);

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json({ removed: true });
}

async function getAgencyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", userId)
    .single();

  if (agency) return agency.id;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .single();

  return membership?.agency_id ?? null;
}
