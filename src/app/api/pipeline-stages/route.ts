import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, notFound, badRequest, internalError } from "@/lib/error-handler";

/**
 * GET /api/pipeline-stages
 * Returns all pipeline stages for the current user's business, ordered by position.
 */
export async function GET() {
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

  // Check if stages exist; if not, create defaults
  const { data: stages, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("business_id", business.id)
    .order("position", { ascending: true });

  if (!stages?.length && !error) {
    // Create default stages
    await supabase.rpc("create_default_pipeline_stages", {
      p_business_id: business.id,
    });

    const { data: newStages } = await supabase
      .from("pipeline_stages")
      .select("*")
      .eq("business_id", business.id)
      .order("position", { ascending: true });

    return NextResponse.json(newStages ?? []);
  }

  return NextResponse.json(stages ?? []);
}

/**
 * POST /api/pipeline-stages
 * Create a new pipeline stage.
 */
export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { name, color, is_won, is_lost } = body as {
    name: string;
    color?: string;
    is_won?: boolean;
    is_lost?: boolean;
  };

  if (!name?.trim()) {
    return badRequest("Name is required");
  }

  // Get max position
  const { data: maxStage } = await supabase
    .from("pipeline_stages")
    .select("position")
    .eq("business_id", business.id)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (maxStage?.position ?? -1) + 1;

  const { data: stage, error } = await supabase
    .from("pipeline_stages")
    .insert({
      business_id: business.id,
      name: name.trim(),
      position,
      color: color ?? "#64748b",
      is_won: is_won ?? false,
      is_lost: is_lost ?? false,
    })
    .select()
    .single();

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json(stage);
}

/**
 * PATCH /api/pipeline-stages
 * Reorder stages. Expects { stages: [{ id, position }] }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json();
  const { stages } = body as { stages: Array<{ id: string; position: number }> };

  if (!stages?.length) {
    return badRequest("Stages array required");
  }

  for (const stage of stages) {
    await supabase
      .from("pipeline_stages")
      .update({ position: stage.position })
      .eq("id", stage.id);
  }

  return NextResponse.json({ success: true });
}
