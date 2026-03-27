import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Basic app check
  checks.app = "ok";

  // Supabase connectivity
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    checks.database = error ? `error: ${error.message}` : "ok";
    if (error) healthy = false;
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message : "unknown"}`;
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
