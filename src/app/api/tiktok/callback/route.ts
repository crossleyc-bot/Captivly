import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TIKTOK_TOKEN_URL } from "@/lib/constants";
import { encryptToken } from "@/lib/token-encryption";

function redirectWithCleanup(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.delete("tiktok_oauth_state");
  return response;
}

export async function GET(request: NextRequest) {
  const authCode = request.nextUrl.searchParams.get("auth_code");
  const errorParam = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Validate CSRF state parameter
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("tiktok_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return redirectWithCleanup(`${appUrl}/onboarding?error=csrf`);
  }

  if (errorParam || !authCode) {
    return redirectWithCleanup(
      `${appUrl}/onboarding?error=tiktok_auth_failed`
    );
  }

  // Exchange auth code for access token
  const tokenRes = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID!,
      secret: process.env.TIKTOK_APP_SECRET!,
      auth_code: authCode,
    }),
  });

  const tokenData = await tokenRes.json();

  if (
    !tokenRes.ok ||
    tokenData.code !== 0 ||
    !tokenData.data?.access_token
  ) {
    return redirectWithCleanup(
      `${appUrl}/onboarding?error=tiktok_token_exchange_failed`
    );
  }

  const accessToken = tokenData.data.access_token as string;
  const refreshToken = (tokenData.data.refresh_token as string) ?? null;
  // TikTok returns advertiser_ids in the token response
  const advertiserIds = tokenData.data.advertiser_ids as string[] | undefined;
  const firstAdvertiserId = advertiserIds?.[0] ?? null;

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
      tiktok_access_token: encryptToken(accessToken),
      tiktok_refresh_token: refreshToken ? encryptToken(refreshToken) : null,
      tiktok_advertiser_id: firstAdvertiserId,
    })
    .eq("user_id", user.id);

  return redirectWithCleanup(`${appUrl}/onboarding?tiktok=connected`);
}
