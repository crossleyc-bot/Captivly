import { describe, it, expect, vi, beforeEach } from "vitest";
import { requirePlan } from "../feature-gate";
import type { PlanTier } from "@/types/database";

// Mock the Supabase server client so checkUsageLimit can be tested
vi.mock("../supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "../supabase/server";

const mockCreateClient = vi.mocked(createClient);

describe("requirePlan", () => {
  it("starter meets starter requirement", () => {
    expect(requirePlan("starter", "starter")).toBe(true);
  });

  it("starter does NOT meet growth requirement", () => {
    expect(requirePlan("starter", "growth")).toBe(false);
  });

  it("starter does NOT meet pro requirement", () => {
    expect(requirePlan("starter", "pro")).toBe(false);
  });

  it("growth meets starter requirement", () => {
    expect(requirePlan("growth", "starter")).toBe(true);
  });

  it("growth meets growth requirement", () => {
    expect(requirePlan("growth", "growth")).toBe(true);
  });

  it("growth does NOT meet pro requirement", () => {
    expect(requirePlan("growth", "pro")).toBe(false);
  });

  it("pro meets all requirements", () => {
    const tiers: PlanTier[] = ["starter", "growth", "pro"];
    for (const tier of tiers) {
      expect(requirePlan("pro", tier)).toBe(true);
    }
  });
});

describe("checkUsageLimit", () => {
  // We need to dynamically import to pick up the mock
  let checkUsageLimit: typeof import("../feature-gate").checkUsageLimit;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("../feature-gate");
    checkUsageLimit = mod.checkUsageLimit;
  });

  function mockSupabaseUsage(leadsCount: number | null, smsCount: number | null) {
    const single = vi.fn().mockResolvedValue({
      data: leadsCount !== null || smsCount !== null
        ? { leads_count: leadsCount ?? 0, sms_count: smsCount ?? 0 }
        : null,
    });
    const eq2 = vi.fn().mockReturnValue({ single });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const select = vi.fn().mockReturnValue({ eq: eq1 });
    const from = vi.fn().mockReturnValue({ select });

    mockCreateClient.mockResolvedValue({ from } as ReturnType<typeof mockCreateClient>);
  }

  it("allows when under lead limit", async () => {
    mockSupabaseUsage(50, 0);
    const result = await checkUsageLimit("biz-1", "starter", "leads");
    expect(result).toEqual({ allowed: true, current: 50, limit: 100 });
  });

  it("blocks when at lead limit", async () => {
    mockSupabaseUsage(100, 0);
    const result = await checkUsageLimit("biz-1", "starter", "leads");
    expect(result).toEqual({ allowed: false, current: 100, limit: 100 });
  });

  it("blocks when over lead limit", async () => {
    mockSupabaseUsage(150, 0);
    const result = await checkUsageLimit("biz-1", "starter", "leads");
    expect(result).toEqual({ allowed: false, current: 150, limit: 100 });
  });

  it("defaults to 0 when no usage record exists", async () => {
    mockSupabaseUsage(null, null);
    // When single() returns null data, counts default to 0
    const single = vi.fn().mockResolvedValue({ data: null });
    const eq2 = vi.fn().mockReturnValue({ single });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const select = vi.fn().mockReturnValue({ eq: eq1 });
    const from = vi.fn().mockReturnValue({ select });
    mockCreateClient.mockResolvedValue({ from } as ReturnType<typeof mockCreateClient>);

    const result = await checkUsageLimit("biz-1", "starter", "leads");
    expect(result).toEqual({ allowed: true, current: 0, limit: 100 });
  });

  it("starter SMS limit is 0, always blocked", async () => {
    mockSupabaseUsage(0, 0);
    const result = await checkUsageLimit("biz-1", "starter", "sms");
    expect(result).toEqual({ allowed: false, current: 0, limit: 0 });
  });

  it("growth allows SMS under limit", async () => {
    mockSupabaseUsage(0, 200);
    const result = await checkUsageLimit("biz-1", "growth", "sms");
    expect(result).toEqual({ allowed: true, current: 200, limit: 500 });
  });

  it("growth blocks SMS at limit", async () => {
    mockSupabaseUsage(0, 500);
    const result = await checkUsageLimit("biz-1", "growth", "sms");
    expect(result).toEqual({ allowed: false, current: 500, limit: 500 });
  });

  it("pro has higher limits", async () => {
    mockSupabaseUsage(1999, 1999);
    const leadsResult = await checkUsageLimit("biz-1", "pro", "leads");
    expect(leadsResult.allowed).toBe(true);
    expect(leadsResult.limit).toBe(2000);
  });
});
