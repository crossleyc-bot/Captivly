import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/agency/members — list agency members
 * POST /api/agency/members — invite a member by email
 * DELETE /api/agency/members — remove a member
 */

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user owns an agency
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  let agencyId = agency?.id;

  if (!agencyId) {
    // Check if user is a member of any agency
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .single();

    agencyId = membership?.agency_id;
  }

  if (!agencyId) {
    return NextResponse.json({ error: "No agency found" }, { status: 404 });
  }

  const { data: members } = await supabase
    .from("agency_members")
    .select("*, user:users(email, full_name)")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ members: members ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (!agency) {
    return NextResponse.json({ error: "No agency found" }, { status: 404 });
  }

  const { email, role } = (await request.json()) as {
    email: string;
    role?: string;
  };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Find the user by email
  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!targetUser) {
    return NextResponse.json(
      { error: "No user found with that email. They must sign up first." },
      { status: 404 }
    );
  }

  const memberRole = role === "admin" ? "admin" : "member";

  const { error } = await supabase.from("agency_members").insert({
    agency_id: agency.id,
    user_id: targetUser.id,
    role: memberRole,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "User is already a member of this agency" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ added: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is owner or admin
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  let agencyId = agency?.id;
  let callerRole = agency ? "owner" : null;

  if (!agencyId) {
    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id, role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .single();

    agencyId = membership?.agency_id;
    callerRole = membership?.role ?? null;
  }

  if (!agencyId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { member_id } = (await request.json()) as { member_id: string };

  const { data: member } = await supabase
    .from("agency_members")
    .select("user_id, role")
    .eq("id", member_id)
    .eq("agency_id", agencyId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.role === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the agency owner" },
      { status: 400 }
    );
  }

  // Admins can only remove regular members, not other admins
  if (callerRole === "admin" && member.role === "admin") {
    return NextResponse.json(
      { error: "Admins cannot remove other admins" },
      { status: 403 }
    );
  }

  await supabase
    .from("agency_members")
    .delete()
    .eq("id", member_id)
    .eq("agency_id", agencyId);

  return NextResponse.json({ removed: true });
}
