import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate authenticated user
  // TODO: Fetch business and campaign data
  // TODO: Check plan limits for sequence steps
  // TODO: Call Claude API to generate sequence
  // TODO: Save sequence and steps to Supabase

  console.log("Generate sequence request:", JSON.stringify(body));

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
