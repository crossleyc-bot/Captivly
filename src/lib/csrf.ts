import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

/** Generate a random CSRF token. */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Set the CSRF cookie on a response if not already present.
 * Called from middleware on non-API page requests.
 */
export function setCsrfCookie(request: NextRequest, response: NextResponse): NextResponse {
  const existing = request.cookies.get(CSRF_COOKIE);
  if (!existing) {
    const token = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // Client JS must read this to include in headers
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }
  return response;
}

/**
 * Validate that the CSRF header matches the CSRF cookie.
 * Returns a 403 response if validation fails, or null if valid.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: "Missing CSRF token" }, { status: 403 });
  }

  if (cookieToken.length !== headerToken.length || cookieToken !== headerToken) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  return null;
}
