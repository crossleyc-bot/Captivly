import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined;
  if (env && env in LOG_LEVEL_PRIORITY) return env;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[getMinLevel()];
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function formatDev(entry: LogEntry): string {
  const { level, message, timestamp, ...meta } = entry;
  const levelUpper = level.toUpperCase().padEnd(5);
  const time = timestamp.split("T")[1]?.replace("Z", "") ?? timestamp;
  const metaStr =
    Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `[${time}] ${levelUpper} ${message}${metaStr}`;
}

function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const output = isProduction() ? JSON.stringify(entry) : formatDev(entry);

  // Report errors and warnings to Sentry in production
  if (isProduction()) {
    if (level === "error") {
      const errorObj = meta?.error instanceof Error ? meta.error : new Error(message);
      Sentry.captureException(errorObj, {
        extra: meta,
      });
    } else if (level === "warn") {
      Sentry.captureMessage(message, {
        level: "warning",
        extra: meta,
      });
    }
  }

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    log("debug", message, meta);
  },
  info(message: string, meta?: Record<string, unknown>): void {
    log("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    log("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>): void {
    log("error", message, meta);
  },
};
