import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { auditLog } from "@/lib/audit-log";
import { logger } from "@/lib/logger";

describe("auditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("logs the action via structured logger", () => {
    auditLog({
      user_id: "user-123",
      action: "user.login",
    });

    expect(logger.info).toHaveBeenCalledWith(
      "audit: user.login",
      expect.objectContaining({
        user_id: "user-123",
        action: "user.login",
      })
    );
  });

  it("inserts record into database", () => {
    auditLog({
      user_id: "user-123",
      business_id: "biz-456",
      action: "campaign.create",
      resource_type: "campaign",
      resource_id: "camp-789",
      details: { name: "Summer Sale" },
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-123",
        business_id: "biz-456",
        action: "campaign.create",
        resource_type: "campaign",
        resource_id: "camp-789",
        details: { name: "Summer Sale" },
      })
    );
  });

  it("handles null optional fields", () => {
    auditLog({
      action: "webhook.received",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        business_id: null,
        resource_type: null,
        resource_id: null,
        details: null,
        ip_address: null,
      })
    );
  });

  it("logs warning when database insert fails", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB error" } });

    auditLog({
      action: "user.login",
    });

    // Wait for the async insert to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to write audit log to database",
      expect.objectContaining({
        action: "user.login",
        error: "DB error",
      })
    );
  });
});
