import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=meta_auth_failed`
    );
  }

  // TODO: Exchange code for access token
  // TODO: Store access token in businesses table
  // TODO: Redirect to onboarding next step

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?meta=connected`
  );
}
