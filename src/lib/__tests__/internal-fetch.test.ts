import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
vi.stubEnv("INTERNAL_API_SECRET", "test-secret");

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { internalFetch, triggerLeadScoring, triggerReferralTracking } from "@/lib/internal-fetch";
import { logger } from "@/lib/logger";

describe("internalFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("makes a POST request to the internal API", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    internalFetch("/api/leads/score", { lead_id: "123" });

    await vi.advanceTimersByTimeAsync(0);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/leads/score",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-secret",
        }),
        body: JSON.stringify({ lead_id: "123" }),
      })
    );
  });

  it("retries on failure with exponential backoff", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true });

    internalFetch("/api/leads/score", { lead_id: "123" }, {
      maxRetries: 3,
      baseDelayMs: 100,
    });

    // First attempt
    await vi.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // After first retry delay (100ms)
    await vi.advanceTimersByTimeAsync(100);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // After second retry delay (200ms)
    await vi.advanceTimersByTimeAsync(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("logs error after max retries exhausted", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    internalFetch("/api/test", { id: "1" }, {
      maxRetries: 1,
      baseDelayMs: 50,
      context: "test-context",
    });

    // First attempt
    await vi.advanceTimersByTimeAsync(0);
    // Retry
    await vi.advanceTimersByTimeAsync(50);

    // Wait for final logging
    await vi.advanceTimersByTimeAsync(0);

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("failed after"),
      expect.objectContaining({ context: "test-context" })
    );
  });
});

describe("triggerLeadScoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("calls /api/leads/score with lead_id", () => {
    triggerLeadScoring("lead-123", "meta");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/leads/score",
      expect.objectContaining({
        body: JSON.stringify({ lead_id: "lead-123" }),
      })
    );
  });
});

describe("triggerReferralTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("calls /api/referrals/track with lead_id and referral_code", () => {
    triggerReferralTracking("lead-123", "REF-ABC", "google");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/referrals/track",
      expect.objectContaining({
        body: JSON.stringify({ lead_id: "lead-123", referral_code: "REF-ABC" }),
      })
    );
  });
});
