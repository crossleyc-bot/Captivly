import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Validates that a request carries the correct internal API secret.
 * Use on endpoints that are called server-to-server only (webhooks, cron, etc.)
 * and must never be accessible from the browser.
 *
 * Expects: Authorization: Bearer <INTERNAL_API_SECRET>
 */
export function validateInternalAuth(
  request: NextRequest
): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error("INTERNAL_API_SECRET is not configured");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  // Constant-time comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);

  if (
    tokenBuffer.length !== secretBuffer.length ||
    !timingSafeEqual(tokenBuffer, secretBuffer)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Auth passed
}

/**
 * Returns the Authorization header value for internal API calls.
 */
export function getInternalAuthHeader(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.INTERNAL_API_SECRET ?? ""}`,
  };
}
