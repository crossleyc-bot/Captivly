import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { TIKTOK_OAUTH_BASE_URL } from "@/lib/constants";

export async function GET() {
  const appId = process.env.TIKTOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok/callback`;

  const state = randomUUID();

  const params = new URLSearchParams({
    app_id: appId!,
    redirect_uri: redirectUri,
    state,
  });

  const authUrl = `${TIKTOK_OAUTH_BASE_URL}?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
