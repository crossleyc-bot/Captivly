import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, PLAN_HIERARCHY } from "../constants";

describe("PLAN_LIMITS", () => {
  it("defines limits for all three tiers", () => {
    expect(PLAN_LIMITS).toHaveProperty("starter");
    expect(PLAN_LIMITS).toHaveProperty("growth");
    expect(PLAN_LIMITS).toHaveProperty("pro");
  });

  it("starter has correct limits", () => {
    expect(PLAN_LIMITS.starter).toEqual({
      leads_per_month: 100,
      sms_per_month: 0,
      campaigns: 1,
      sequence_steps: 3,
    });
  });

  it("growth has higher limits than starter", () => {
    expect(PLAN_LIMITS.growth.leads_per_month).toBeGreaterThan(
      PLAN_LIMITS.starter.leads_per_month
    );
    expect(PLAN_LIMITS.growth.sms_per_month).toBeGreaterThan(
      PLAN_LIMITS.starter.sms_per_month
    );
    expect(PLAN_LIMITS.growth.campaigns).toBeGreaterThan(
      PLAN_LIMITS.starter.campaigns
    );
  });

  it("pro has highest limits", () => {
    expect(PLAN_LIMITS.pro.leads_per_month).toBeGreaterThan(
      PLAN_LIMITS.growth.leads_per_month
    );
    expect(PLAN_LIMITS.pro.sms_per_month).toBeGreaterThanOrEqual(
      PLAN_LIMITS.growth.sms_per_month
    );
    expect(PLAN_LIMITS.pro.campaigns).toBe(Infinity);
  });

  it("starter has 0 SMS", () => {
    expect(PLAN_LIMITS.starter.sms_per_month).toBe(0);
  });
});

describe("PLAN_HIERARCHY", () => {
  it("starter < growth < pro", () => {
    expect(PLAN_HIERARCHY.starter).toBeLessThan(PLAN_HIERARCHY.growth);
    expect(PLAN_HIERARCHY.growth).toBeLessThan(PLAN_HIERARCHY.pro);
  });
});
