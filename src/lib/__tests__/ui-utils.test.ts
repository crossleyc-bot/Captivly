import { describe, it, expect } from "vitest";
import {
  scoreColor,
  leadStatusBadge,
  campaignStatusBadge,
  dealActivityBadge,
  formatCents,
  msgStatusColor,
  ticketStatusBadge,
  ticketUrgencyColor,
} from "@/lib/ui-utils";

describe("scoreColor", () => {
  it("returns green for scores >= 8", () => {
    expect(scoreColor(8)).toBe("text-green-600");
    expect(scoreColor(9)).toBe("text-green-600");
    expect(scoreColor(10)).toBe("text-green-600");
  });

  it("returns yellow for scores 5-7", () => {
    expect(scoreColor(5)).toBe("text-yellow-600");
    expect(scoreColor(6)).toBe("text-yellow-600");
    expect(scoreColor(7)).toBe("text-yellow-600");
  });

  it("returns red for scores < 5", () => {
    expect(scoreColor(1)).toBe("text-red-500");
    expect(scoreColor(4)).toBe("text-red-500");
  });

  it("returns slate for null scores", () => {
    expect(scoreColor(null)).toBe("text-slate-400");
  });
});

describe("leadStatusBadge", () => {
  it("returns correct colors for all statuses", () => {
    expect(leadStatusBadge("new")).toBe("bg-blue-100 text-blue-700");
    expect(leadStatusBadge("in_sequence")).toBe("bg-purple-100 text-purple-700");
    expect(leadStatusBadge("replied")).toBe("bg-green-100 text-green-700");
    expect(leadStatusBadge("converted")).toBe("bg-emerald-100 text-emerald-700");
    expect(leadStatusBadge("cold")).toBe("bg-slate-100 text-slate-600");
    expect(leadStatusBadge("unsubscribed")).toBe("bg-red-100 text-red-600");
  });

  it("returns fallback for unknown statuses", () => {
    expect(leadStatusBadge("unknown")).toBe("bg-slate-100 text-slate-600");
  });
});

describe("campaignStatusBadge", () => {
  it("returns correct colors for all statuses", () => {
    expect(campaignStatusBadge("draft")).toBe("bg-slate-100 text-slate-600");
    expect(campaignStatusBadge("active")).toBe("bg-green-100 text-green-700");
    expect(campaignStatusBadge("paused")).toBe("bg-yellow-100 text-yellow-700");
    expect(campaignStatusBadge("completed")).toBe("bg-blue-100 text-blue-700");
  });

  it("returns fallback for unknown statuses", () => {
    expect(campaignStatusBadge("archived")).toBe("bg-slate-100 text-slate-600");
  });
});

describe("dealActivityBadge", () => {
  it("returns correct colors for all types", () => {
    expect(dealActivityBadge("stage_change")).toBe("bg-blue-100 text-blue-700");
    expect(dealActivityBadge("note")).toBe("bg-slate-100 text-slate-700");
    expect(dealActivityBadge("created")).toBe("bg-green-100 text-green-700");
    expect(dealActivityBadge("closed")).toBe("bg-emerald-100 text-emerald-700");
  });
});

describe("formatCents", () => {
  it("formats whole dollars", () => {
    expect(formatCents(10000)).toBe("$100.00");
  });

  it("formats cents", () => {
    expect(formatCents(4999)).toBe("$49.99");
  });

  it("formats zero", () => {
    expect(formatCents(0)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(formatCents(1000000)).toBe("$10,000.00");
  });
});

describe("msgStatusColor", () => {
  it("returns correct colors for all statuses", () => {
    expect(msgStatusColor("queued")).toBe("text-slate-500");
    expect(msgStatusColor("sent")).toBe("text-blue-600");
    expect(msgStatusColor("delivered")).toBe("text-green-600");
    expect(msgStatusColor("failed")).toBe("text-red-600");
    expect(msgStatusColor("replied")).toBe("text-emerald-600");
  });

  it("returns fallback for unknown statuses", () => {
    expect(msgStatusColor("unknown")).toBe("text-slate-500");
  });
});

describe("ticketStatusBadge", () => {
  it("returns correct colors for all statuses", () => {
    expect(ticketStatusBadge("open")).toBe("bg-blue-100 text-blue-700");
    expect(ticketStatusBadge("in_progress")).toBe("bg-yellow-100 text-yellow-700");
    expect(ticketStatusBadge("resolved")).toBe("bg-green-100 text-green-700");
    expect(ticketStatusBadge("closed")).toBe("bg-slate-100 text-slate-600");
  });
});

describe("ticketUrgencyColor", () => {
  it("returns correct colors for all urgencies", () => {
    expect(ticketUrgencyColor("low")).toBe("text-slate-500");
    expect(ticketUrgencyColor("medium")).toBe("text-yellow-600");
    expect(ticketUrgencyColor("high")).toBe("text-red-600");
  });
});
