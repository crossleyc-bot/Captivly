import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { GOOGLE_OAUTH_BASE_URL } from "@/lib/constants";

export async function GET() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;

  const state = randomUUID();

  const scopes = [
    "https://www.googleapis.com/auth/adwords",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `${GOOGLE_OAUTH_BASE_URL}?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
