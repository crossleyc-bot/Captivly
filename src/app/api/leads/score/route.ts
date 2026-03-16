import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate authenticated user
  // TODO: Fetch lead and business data from Supabase
  // TODO: Call Claude API to score lead
  // TODO: Update lead record with score

  console.log("Score lead request:", JSON.stringify(body));

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
