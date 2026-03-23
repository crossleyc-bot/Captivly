import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { LINKEDIN_OAUTH_BASE_URL } from "@/lib/constants";

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`;

  const state = randomUUID();

  const scopes = [
    "r_ads",
    "r_ads_leadgen_automation",
    "rw_ads",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId!,
    redirect_uri: redirectUri,
    scope: scopes,
    state,
  });

  const authUrl = `${LINKEDIN_OAUTH_BASE_URL}?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
