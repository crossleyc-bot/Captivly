import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executePipelineAutomations } from "@/lib/pipeline-automations";

/**
 * GET /api/deals
 * Returns all deals for the current user's business.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const stageId = request.nextUrl.searchParams.get("stage_id");

  let query = supabase
    .from("deals")
    .select("id, stage_id, title, value_cents, expected_close_date, created_at, business_id, lead:leads(id, first_name, last_name, email, ai_score), stage:pipeline_stages(id, name, color, is_won, is_lost)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (stageId) {
    query = query.eq("stage_id", stageId);
  }

  const { data: deals, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(deals ?? []);
}

/**
 * POST /api/deals
 * Create a new deal.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, lead_id, stage_id, value_cents, expected_close_date, notes } = body as {
    title: string;
    lead_id?: string;
    stage_id?: string;
    value_cents?: number;
    expected_close_date?: string;
    notes?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // If no stage provided, use the first stage
  let finalStageId = stage_id ?? null;
  if (!finalStageId) {
    const { data: firstStage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("business_id", business.id)
      .order("position", { ascending: true })
      .limit(1)
      .single();

    finalStageId = firstStage?.id ?? null;
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      business_id: business.id,
      lead_id: lead_id ?? null,
      stage_id: finalStageId,
      title: title.trim(),
      value_cents: value_cents ?? 0,
      expected_close_date: expected_close_date ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log creation activity
  await supabase.from("deal_activities").insert({
    deal_id: deal.id,
    type: "created",
    to_stage_id: finalStageId,
    content: `Deal "${title.trim()}" created`,
  });

  return NextResponse.json(deal);
}

/**
 * PATCH /api/deals
 * Update a deal (move stage, edit fields).
 * Expects { id, ...fields }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = await request.json();
  const { id, stage_id, title, value_cents, expected_close_date, notes } = body as {
    id: string;
    stage_id?: string;
    title?: string;
    value_cents?: number;
    expected_close_date?: string | null;
    notes?: string | null;
  };

  if (!id) {
    return NextResponse.json({ error: "Deal ID is required" }, { status: 400 });
  }

  // Get current deal for activity logging, scoped to user's business
  const { data: currentDeal } = await supabase
    .from("deals")
    .select("stage_id, title")
    .eq("id", id)
    .eq("business_id", business.id)
    .single();

  if (!currentDeal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (stage_id !== undefined) updates.stage_id = stage_id;
  if (title !== undefined) updates.title = title;
  if (value_cents !== undefined) updates.value_cents = value_cents;
  if (expected_close_date !== undefined) updates.expected_close_date = expected_close_date;
  if (notes !== undefined) updates.notes = notes;

  // Check if moving to a won/lost stage
  if (stage_id) {
    const { data: newStage } = await supabase
      .from("pipeline_stages")
      .select("is_won, is_lost")
      .eq("id", stage_id)
      .single();

    if (newStage?.is_won || newStage?.is_lost) {
      updates.closed_at = new Date().toISOString();
    } else {
      updates.closed_at = null;
    }
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .update(updates)
    .eq("id", id)
    .eq("business_id", business.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log stage change activity
  if (stage_id && currentDeal && stage_id !== currentDeal.stage_id) {
    const { data: newStage } = await supabase
      .from("pipeline_stages")
      .select("name, is_won, is_lost")
      .eq("id", stage_id)
      .single();

    const activityType = newStage?.is_won || newStage?.is_lost ? "closed" : "stage_change";

    await supabase.from("deal_activities").insert({
      deal_id: id,
      type: activityType,
      from_stage_id: currentDeal.stage_id,
      to_stage_id: stage_id,
      content: `Moved to ${newStage?.name ?? "unknown stage"}`,
    });

    // Fire pipeline automations (non-blocking)
    executePipelineAutomations(supabase, id, stage_id, deal.business_id).catch((err) =>
      console.error("Pipeline automation error:", err)
    );
  }

  return NextResponse.json(deal);
}

/**
 * DELETE /api/deals
 * Delete a deal. Expects { id }.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const body = await request.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "Deal ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("deals").delete().eq("id", id).eq("business_id", business.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
