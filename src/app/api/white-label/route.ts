import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier } from "@/types/database";

/**
 * GET /api/white-label — get white-label config for current business
 * PUT /api/white-label — update white-label config
 */

export async function GET() {
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
      { error: "White-labeling requires the Pro plan" },
      { status: 403 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { data: config } = await supabase
    .from("white_label_config")
    .select("*")
    .eq("business_id", business.id)
    .single();

  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
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
      { error: "White-labeling requires the Pro plan" },
      { status: 403 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    app_name?: string;
    logo_url?: string;
    primary_color?: string;
    accent_color?: string;
    favicon_url?: string;
    hide_captivly_branding?: boolean;
  };

  // Upsert config
  const { data: config, error } = await supabase
    .from("white_label_config")
    .upsert(
      {
        business_id: business.id,
        app_name: body.app_name ?? "Captivly",
        logo_url: body.logo_url ?? null,
        primary_color: body.primary_color ?? "#18181b",
        accent_color: body.accent_color ?? "#3b82f6",
        favicon_url: body.favicon_url ?? null,
        hide_captivly_branding: body.hide_captivly_branding ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config });
}
