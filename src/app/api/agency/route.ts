import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier } from "@/types/database";

/**
 * GET /api/agency — get current user's agency
 * POST /api/agency — create an agency (Pro plan only)
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
    .select("*")
    .eq("owner_user_id", user.id)
    .single();

  if (!agency) {
    // Check if user is a member of any agency
    const { data: membership } = await supabase
      .from("agency_members")
      .select("*, agency:agencies(*)")
      .eq("user_id", user.id)
      .single();

    if (membership) {
      return NextResponse.json({ agency: membership.agency, role: membership.role });
    }

    return NextResponse.json({ agency: null });
  }

  return NextResponse.json({ agency, role: "owner" });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  if (!requirePlan((dbUser?.plan_tier ?? "starter") as PlanTier, "pro")) {
    return NextResponse.json(
      { error: "Agency mode requires the Pro plan" },
      { status: 403 }
    );
  }

  // Check if user already has an agency
  const { data: existing } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You already have an agency" },
      { status: 409 }
    );
  }

  const { name } = (await request.json()) as { name: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Agency name is required" }, { status: 400 });
  }

  const { data: agency, error } = await supabase
    .from("agencies")
    .insert({
      owner_user_id: user.id,
      name: name.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add owner as a member too
  await supabase.from("agency_members").insert({
    agency_id: agency.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ agency });
}
