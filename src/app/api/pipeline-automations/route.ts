import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, notFound, badRequest, internalError } from "@/lib/error-handler";
import type { PipelineAutomationAction } from "@/types/database";

/**
 * GET /api/pipeline-automations
 * List all automations for the user's business.
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

  const { data: automations, error } = await supabase
    .from("pipeline_automations")
    .select("*, stage:pipeline_stages(id, name, color)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json(automations ?? []);
}

const VALID_ACTIONS: PipelineAutomationAction[] = [
  "send_email",
  "send_sms",
  "update_lead_status",
  "create_activity_note",
];

/**
 * POST /api/pipeline-automations
 * Create a new pipeline automation.
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
  const { name, trigger_stage_id, action_type, action_config } = body as {
    name: string;
    trigger_stage_id: string;
    action_type: PipelineAutomationAction;
    action_config: Record<string, unknown>;
  };

  if (!name?.trim() || name.length > 100) {
    return badRequest("Name is required (max 100 chars)");
  }
  if (!trigger_stage_id) {
    return badRequest("Trigger stage is required");
  }
  if (!VALID_ACTIONS.includes(action_type)) {
    return badRequest("Invalid action type");
  }

  // Validate action_config based on action type
  if (action_type === "send_email") {
    if (!action_config.subject || !action_config.body) {
      return badRequest("Email subject and body are required");
    }
  }
  if (action_type === "send_sms" && !action_config.body) {
    return badRequest("SMS body is required");
  }
  if (action_type === "update_lead_status" && !action_config.lead_status) {
    return badRequest("Lead status is required");
  }
  if (action_type === "create_activity_note" && !action_config.note) {
    return badRequest("Note content is required");
  }

  // Verify stage belongs to this business
  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("id", trigger_stage_id)
    .eq("business_id", business.id)
    .single();

  if (!stage) {
    return notFound("Stage not found");
  }

  const { data: automation, error } = await supabase
    .from("pipeline_automations")
    .insert({
      business_id: business.id,
      name: name.trim(),
      trigger_stage_id,
      action_type,
      action_config,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json(automation);
}

/**
 * PATCH /api/pipeline-automations
 * Update an automation (toggle active, edit config).
 */
export async function PATCH(request: NextRequest) {
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
  const { id, name, trigger_stage_id, action_type, action_config, is_active } = body as {
    id: string;
    name?: string;
    trigger_stage_id?: string;
    action_type?: PipelineAutomationAction;
    action_config?: Record<string, unknown>;
    is_active?: boolean;
  };

  if (!id) {
    return badRequest("Automation ID is required");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined && typeof name === "string") updates.name = name.trim();
  if (trigger_stage_id !== undefined) updates.trigger_stage_id = trigger_stage_id;
  if (action_type !== undefined) updates.action_type = action_type;
  if (action_config !== undefined) updates.action_config = action_config;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data: automation, error } = await supabase
    .from("pipeline_automations")
    .update(updates)
    .eq("id", id)
    .eq("business_id", business.id)
    .select()
    .single();

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json(automation);
}

/**
 * DELETE /api/pipeline-automations
 * Delete an automation.
 */
export async function DELETE(request: NextRequest) {
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
  const { id } = body as { id: string };

  if (!id) {
    return badRequest("Automation ID is required");
  }

  const { error } = await supabase.from("pipeline_automations").delete().eq("id", id).eq("business_id", business.id);

  if (error) {
    return internalError(error.message);
  }

  return NextResponse.json({ success: true });
}
