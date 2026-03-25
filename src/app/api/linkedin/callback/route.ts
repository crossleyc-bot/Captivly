import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LINKEDIN_TOKEN_URL, LINKEDIN_API_BASE_URL } from "@/lib/constants";
import { encryptToken } from "@/lib/token-encryption";

function redirectWithCleanup(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.delete("linkedin_oauth_state");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const errorParam = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Validate CSRF state parameter
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("linkedin_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return redirectWithCleanup(`${appUrl}/onboarding?error=csrf`);
  }

  if (errorParam || !code) {
    return redirectWithCleanup(
      `${appUrl}/onboarding?error=linkedin_auth_failed`
    );
  }

  // Exchange code for access token
  const tokenRes = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/linkedin/callback`,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    return redirectWithCleanup(
      `${appUrl}/onboarding?error=linkedin_token_exchange_failed`
    );
  }

  const accessToken = tokenData.access_token as string;
  const refreshToken = (tokenData.refresh_token as string) ?? null;

  // Fetch ad accounts the user has access to
  const adAccountsRes = await fetch(
    `${LINKEDIN_API_BASE_URL}/adAccounts?q=search&search=(status:(values:List(ACTIVE)))&count=1`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  const adAccountsData = await adAccountsRes.json();
  // LinkedIn ad account URNs look like "urn:li:sponsoredAccount:123456"
  const firstAccountUrn = adAccountsData.elements?.[0]?.id ?? null;
  const adAccountId = firstAccountUrn
    ? String(firstAccountUrn).replace("urn:li:sponsoredAccount:", "")
    : null;

  // Store in database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithCleanup(`${appUrl}/login`);
  }

  await supabase
    .from("businesses")
    .update({
      linkedin_access_token: encryptToken(accessToken),
      linkedin_refresh_token: refreshToken ? encryptToken(refreshToken) : null,
      linkedin_ad_account_id: adAccountId,
    })
    .eq("user_id", user.id);

  return redirectWithCleanup(`${appUrl}/onboarding?linkedin=connected`);
}
