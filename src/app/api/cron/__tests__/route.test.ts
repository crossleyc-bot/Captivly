import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

// Mock dead-letter-retry module
const mockProcessDeadLetterQueue = vi.fn();
vi.mock("../dead-letter-retry", () => ({
  processDeadLetterQueue: (...args: unknown[]) => mockProcessDeadLetterQueue(...args),
}));

// Mock usage-reset module
const mockResetMonthlyUsage = vi.fn();
vi.mock("../usage-reset", () => ({
  resetMonthlyUsage: (...args: unknown[]) => mockResetMonthlyUsage(...args),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock global fetch for internal proxy calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET } from "../route";
import { NextRequest } from "next/server";

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(url, { headers });
}

function authHeaders(): Record<string, string> {
  return { Authorization: "Bearer test-internal-secret" };
}

describe("GET /api/cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auth validation", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const req = makeRequest("http://localhost:3000/api/cron?job=usage-reset");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when Authorization token is invalid", async () => {
      const req = makeRequest("http://localhost:3000/api/cron?job=usage-reset", {
        Authorization: "Bearer wrong-secret",
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });
  });

  describe("parameter validation", () => {
    it("returns 400 when job param is missing", async () => {
      const req = makeRequest("http://localhost:3000/api/cron", authHeaders());
      const res = await GET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Missing required query parameter");
    });

    it("returns 400 for an invalid job name", async () => {
      const req = makeRequest(
        "http://localhost:3000/api/cron?job=nonexistent",
        authHeaders()
      );
      const res = await GET(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid job name");
      expect(data.error).toContain("nonexistent");
    });
  });

  describe("sequence-scheduler job", () => {
    it("proxies to the sequence scheduler endpoint and returns result", async () => {
      const schedulerResult = { queued: 5, sent: 3, due: 3, timestamp: "2026-03-27T00:00:00.000Z" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => schedulerResult,
      });

      const req = makeRequest(
        "http://localhost:3000/api/cron?job=sequence-scheduler",
        authHeaders()
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.job).toBe("sequence-scheduler");
      expect(data.status).toBe("completed");
      expect(data.result).toEqual(schedulerResult);
      expect(data.durationMs).toBeTypeOf("number");
      expect(data.timestamp).toBeDefined();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/sequences/scheduler",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("returns 500 when the scheduler endpoint fails", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const req = makeRequest(
        "http://localhost:3000/api/cron?job=sequence-scheduler",
        authHeaders()
      );
      const res = await GET(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.job).toBe("sequence-scheduler");
      expect(data.status).toBe("failed");
      expect(data.error).toContain("HTTP 500");
    });
  });

  describe("report-cards job", () => {
    it("proxies to the report generation endpoint and returns result", async () => {
      const reportResult = { generated: 2, month: "2026-02" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => reportResult,
      });

      const req = makeRequest(
        "http://localhost:3000/api/cron?job=report-cards",
        authHeaders()
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.job).toBe("report-cards");
      expect(data.status).toBe("completed");
      expect(data.result).toEqual(reportResult);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/reports/generate",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("dead-letter-retry job", () => {
    it("calls processDeadLetterQueue and returns counts", async () => {
      mockProcessDeadLetterQueue.mockResolvedValueOnce({
        processed: 3,
        failed: 1,
        skipped: 0,
      });

      const req = makeRequest(
        "http://localhost:3000/api/cron?job=dead-letter-retry",
        authHeaders()
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.job).toBe("dead-letter-retry");
      expect(data.status).toBe("completed");
      expect(data.result).toEqual({ processed: 3, failed: 1, skipped: 0 });

      expect(mockProcessDeadLetterQueue).toHaveBeenCalledOnce();
    });
  });

  describe("usage-reset job", () => {
    it("calls resetMonthlyUsage and returns created count", async () => {
      mockResetMonthlyUsage.mockResolvedValueOnce({ created: 15 });

      const req = makeRequest(
        "http://localhost:3000/api/cron?job=usage-reset",
        authHeaders()
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.job).toBe("usage-reset");
      expect(data.status).toBe("completed");
      expect(data.result).toEqual({ created: 15 });

      expect(mockResetMonthlyUsage).toHaveBeenCalledOnce();
    });
  });
});
