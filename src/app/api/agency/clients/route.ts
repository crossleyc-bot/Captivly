import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get agency (as owner or member)
  const agencyId = await getAgencyId(supabase, user.id);
  if (!agencyId) {
    return NextResponse.json({ error: "No agency found" }, { status: 404 });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { business_id } = (await request.json()) as { business_id: string };

  if (!business_id) {
    return NextResponse.json({ error: "business_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("businesses")
    .update({ agency_id: agencyId })
    .eq("id", business_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: true });
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
