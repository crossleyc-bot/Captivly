import { type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export function logApiRequest(
  request: NextRequest,
  routeName: string,
  status: number,
  durationMs: number
): void {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  logger.info(`${request.method} ${request.nextUrl.pathname}`, {
    route: routeName,
    method: request.method,
    path: request.nextUrl.pathname,
    status,
    durationMs: Math.round(durationMs),
    ip,
  });
}
