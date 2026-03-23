import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limiter";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

// Webhook routes have their own authentication and should not be rate limited
const WEBHOOK_PATHS = [
  "/api/meta/webhook",
  "/api/stripe/webhook",
  "/api/webhooks/resend",
  "/api/webhooks/twilio",
  "/api/google/webhook",
];

const AUTH_PATHS = ["/login", "/signup", "/reset-password", "/update-password"];

function isWebhookRoute(pathname: string): boolean {
  return WEBHOOK_PATHS.some((p) => pathname.startsWith(p));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip = getClientIp(request);

  // Rate limit auth endpoints more strictly: 10 requests per 60 seconds
  if (isAuthRoute(pathname)) {
    const key = `auth:${ip}`;
    const result = rateLimit(key, 10, 60_000);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  // Rate limit API routes (except webhooks): 60 requests per 60 seconds
  if (isApiRoute(pathname) && !isWebhookRoute(pathname)) {
    const key = `api:${ip}:${pathname}`;
    const result = rateLimit(key, 60, 60_000);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  // Update Supabase auth session
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
