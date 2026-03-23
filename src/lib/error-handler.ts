import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface ApiErrorBody {
  error: string;
  code: string;
  details?: string;
}

/**
 * Standardized API error response helpers.
 * All API routes should use these instead of ad-hoc NextResponse.json({ error }) calls.
 */

export function apiError(
  message: string,
  status: number,
  code: string,
  details?: string
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: message, code };
  if (details) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

export function badRequest(message: string, details?: string): NextResponse<ApiErrorBody> {
  return apiError(message, 400, "BAD_REQUEST", details);
}

export function unauthorized(message = "Unauthorized"): NextResponse<ApiErrorBody> {
  return apiError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message: string, details?: string): NextResponse<ApiErrorBody> {
  return apiError(message, 403, "FORBIDDEN", details);
}

export function notFound(message: string): NextResponse<ApiErrorBody> {
  return apiError(message, 404, "NOT_FOUND");
}

export function internalError(message = "Internal server error"): NextResponse<ApiErrorBody> {
  return apiError(message, 500, "INTERNAL_ERROR");
}

/**
 * Catch-all handler for unexpected errors. Logs the error and returns a 500.
 */
export function handleApiError(
  error: unknown,
  context: string
): NextResponse<ApiErrorBody> {
  logger.error(`API error in ${context}`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return internalError();
}
