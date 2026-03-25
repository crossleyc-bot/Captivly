import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { META_API_BASE_URL } from "@/lib/constants";
import { encryptToken } from "@/lib/token-encryption";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const errorParam = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Validate CSRF state parameter
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("meta_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=csrf`
    );
  }

  if (errorParam || !code) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=meta_auth_failed`
    );
  }

  // Exchange code for short-lived token
  const tokenUrl = new URL(`${META_API_BASE_URL}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  tokenUrl.searchParams.set("redirect_uri", `${appUrl}/api/meta/callback`);
  tokenUrl.searchParams.set("code", code);

  let tokenData: Record<string, unknown>;
  try {
    const tokenRes = await fetch(tokenUrl.toString());
    tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(
        `${appUrl}/onboarding?error=meta_token_exchange_failed`
      );
    }
  } catch {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=meta_token_exchange_failed`
    );
  }

  // Exchange for long-lived token
  const longLivedUrl = new URL(`${META_API_BASE_URL}/oauth/access_token`);
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  longLivedUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  longLivedUrl.searchParams.set("fb_exchange_token", tokenData.access_token as string);

  let longLivedData: Record<string, unknown> = {};
  try {
    const longLivedRes = await fetch(longLivedUrl.toString());
    longLivedData = await longLivedRes.json();
  } catch {
    // Fall back to short-lived token if long-lived exchange fails
  }

  const accessToken = (longLivedData.access_token ?? tokenData.access_token) as string;

  // Fetch user's ad accounts
  let adAccount: Record<string, unknown> | undefined;
  try {
    const adAccountsRes = await fetch(
      `${META_API_BASE_URL}/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    );
    const adAccountsData = await adAccountsRes.json();
    adAccount = adAccountsData.data?.[0];
  } catch {
    // Non-fatal: ad account will be null
  }

  // Fetch user's pages
  let page: Record<string, unknown> | undefined;
  try {
    const pagesRes = await fetch(
      `${META_API_BASE_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();
    page = pagesData.data?.[0];
  } catch {
    // Non-fatal: page will be null
  }

  // Store in database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Subscribe to leadgen webhooks on the page if we have page access
  if (page?.id && page?.access_token) {
    try {
      const subRes = await fetch(
        `${META_API_BASE_URL}/${page.id}/subscribed_apps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscribed_fields: ["leadgen"],
            access_token: page.access_token,
          }),
        }
      );
      if (!subRes.ok) {
        console.error(`Failed to subscribe to Meta leadgen webhooks: ${subRes.status} ${subRes.statusText}`);
      }
    } catch (err) {
      console.error("Error subscribing to Meta leadgen webhooks:", err);
    }
  }

  await supabase
    .from("businesses")
    .update({
      meta_access_token: encryptToken(accessToken),
      meta_ad_account_id: adAccount?.account_id ?? null,
      meta_page_id: page?.id ?? null,
    })
    .eq("user_id", user.id);

  const response = NextResponse.redirect(`${appUrl}/onboarding?meta=connected`);
  response.cookies.delete("meta_oauth_state");
  return response;
}
