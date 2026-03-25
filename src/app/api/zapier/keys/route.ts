import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { generateApiKey } from "@/lib/api-key-auth";
import { unauthorized, badRequest, internalError } from "@/lib/error-handler";

/** List the current user's API keys (prefix only, not the full key). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, key_prefix, name, last_used_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(keys ?? []);
}

/** Create a new API key. Returns the full key once — it cannot be retrieved again. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "Default";

  const { key, hash, prefix } = generateApiKey();

  const serviceClient = getServiceClient();
  const { error } = await serviceClient.from("api_keys").insert({
    user_id: user.id,
    key_hash: hash,
    key_prefix: prefix,
    name: name.slice(0, 50),
  });

  if (error) {
    return internalError(error.message);
  }

  // Return the full key — this is the only time it's visible
  return NextResponse.json({ key, prefix, name });
}

/** Delete an API key. */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await request.json();

  if (!id) {
    return badRequest("id required");
  }

  await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ deleted: true });
}
