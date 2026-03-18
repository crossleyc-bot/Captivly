import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  tokenUrl.searchParams.set("redirect_uri", `${appUrl}/api/meta/callback`);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl.toString());
  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    return NextResponse.redirect(
      `${appUrl}/onboarding?error=meta_token_exchange_failed`
    );
  }

  // Exchange for long-lived token
  const longLivedUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", process.env.META_APP_ID!);
  longLivedUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  longLivedUrl.searchParams.set("fb_exchange_token", tokenData.access_token);

  const longLivedRes = await fetch(longLivedUrl.toString());
  const longLivedData = await longLivedRes.json();

  const accessToken = longLivedData.access_token ?? tokenData.access_token;

  // Fetch user's ad accounts
  const adAccountsRes = await fetch(
    `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
  );
  const adAccountsData = await adAccountsRes.json();
  const adAccount = adAccountsData.data?.[0];

  // Fetch user's pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  );
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.[0];

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
    await fetch(
      `https://graph.facebook.com/v21.0/${page.id}/subscribed_apps`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscribed_fields: ["leadgen"],
          access_token: page.access_token,
        }),
      }
    );
  }

  await supabase
    .from("businesses")
    .update({
      meta_access_token: accessToken,
      meta_ad_account_id: adAccount?.account_id ?? null,
      meta_page_id: page?.id ?? null,
    })
    .eq("user_id", user.id);

  const response = NextResponse.redirect(`${appUrl}/onboarding?meta=connected`);
  response.cookies.delete("meta_oauth_state");
  return response;
}
