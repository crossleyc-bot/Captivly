import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { META_API_VERSION } from "@/lib/constants";

export async function GET() {
  const appId = process.env.META_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;
  const scope = "ads_management,leads_retrieval,pages_show_list,pages_read_engagement";

  const state = randomUUID();

  const authUrl =
    `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&response_type=code` +
    `&state=${state}`;

  const response = NextResponse.redirect(authUrl);

  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
