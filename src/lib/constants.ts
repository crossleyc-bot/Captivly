import type { PlanTier } from "@/types/database";

export const PLAN_LIMITS: Record<
  PlanTier,
  {
    leads_per_month: number;
    sms_per_month: number;
    campaigns: number;
    sequence_steps: number;
  }
> = {
  starter: { leads_per_month: 100, sms_per_month: 0, campaigns: 1, sequence_steps: 3 },
  growth: { leads_per_month: 500, sms_per_month: 500, campaigns: 5, sequence_steps: 5 },
  pro: { leads_per_month: 2000, sms_per_month: 2000, campaigns: Infinity, sequence_steps: 5 },
};

export const PLAN_HIERARCHY: Record<PlanTier, number> = {
  starter: 0,
  growth: 1,
  pro: 2,
};
