import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate authenticated user
  // TODO: Check plan limits for campaigns
  // TODO: Create campaign via Meta Marketing API
  // TODO: Save campaign to Supabase

  console.log("Create campaign request:", JSON.stringify(body));

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
