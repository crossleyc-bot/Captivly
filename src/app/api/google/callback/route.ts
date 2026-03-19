import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GOOGLE_TOKEN_URL, GOOGLE_ADS_API_BASE_URL } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const errorParam = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Validate CSRF state parameter
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("google_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/onboarding?error=csrf`);
  }

  if (errorParam || !code) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=google_auth_failed`
    );
  }

  // Exchange code for tokens
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=google_token_exchange_failed`
    );
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token ?? null;

  // Fetch accessible Google Ads customer accounts
  const customersRes = await fetch(
    `${GOOGLE_ADS_API_BASE_URL}/customers:listAccessibleCustomers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
    }
  );

  const customersData = await customersRes.json();
  // resourceNames are like "customers/1234567890"
  const firstCustomerId =
    customersData.resourceNames?.[0]?.replace("customers/", "") ?? null;

  // Store in database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  await supabase
    .from("businesses")
    .update({
      google_access_token: accessToken,
      google_refresh_token: refreshToken,
      google_customer_id: firstCustomerId,
    })
    .eq("user_id", user.id);

  const response = NextResponse.redirect(
    `${appUrl}/onboarding?google=connected`
  );
  response.cookies.delete("google_oauth_state");
  return response;
}
