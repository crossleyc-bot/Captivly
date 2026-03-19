import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function handleApiError(
  error: unknown,
  context: string
): NextResponse {
  logger.error(`API error in ${context}`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
