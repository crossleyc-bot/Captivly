import { describe, it, expect, vi, beforeEach } from "vitest";
import { stubTestEnv } from "@/__tests__/setup-env";

stubTestEnv();

const mockRpc = vi.fn().mockResolvedValue({});

interface MockChain {
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (resolve: (v: unknown) => void) => Promise<unknown>;
  _callCount?: number;
}

function makeUpdateChain(returnData: unknown = null): MockChain {
  const chain: MockChain = {} as MockChain;
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: returnData });
  chain.then = (resolve: (v: unknown) => void) =>
    Promise.resolve({ data: returnData }).then(resolve);
  return chain;
}

let leadsChain: MockChain;
let messagesChain: MockChain;
let cancelChain: MockChain;

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "leads") return leadsChain;
      if (table === "messages_sent") {
        if ((messagesChain._callCount ?? 0) === 0) {
          messagesChain._callCount = 1;
          return messagesChain;
        }
        return cancelChain;
      }
      return makeUpdateChain();
    }),
    rpc: mockRpc,
  })),
}));

describe("handleLeadReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leadsChain = makeUpdateChain();
    messagesChain = makeUpdateChain({ variant_id: "variant-1" });
    messagesChain._callCount = 0;
    cancelChain = makeUpdateChain([{ id: "msg-2" }, { id: "msg-3" }]);
  });

  it("updates lead status to replied", async () => {
    const { handleLeadReply } = await import("@/lib/reply-handler");

    const result = await handleLeadReply({
      leadId: "lead-1",
      messageId: "msg-1",
      channel: "email",
      repliedAt: "2026-03-19T12:00:00Z",
    });

    expect(leadsChain.update).toHaveBeenCalledWith({
      status: "replied",
      updated_at: "2026-03-19T12:00:00Z",
    });
    expect(result.paused).toBe(true);
  });

  it("marks specific message as replied when messageId provided", async () => {
    const { handleLeadReply } = await import("@/lib/reply-handler");

    await handleLeadReply({
      leadId: "lead-1",
      messageId: "msg-1",
      channel: "sms",
    });

    expect(messagesChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "replied" })
    );
  });

  it("increments variant reply count when message has variant_id", async () => {
    const { handleLeadReply } = await import("@/lib/reply-handler");

    await handleLeadReply({
      leadId: "lead-1",
      messageId: "msg-1",
      channel: "email",
    });

    expect(mockRpc).toHaveBeenCalledWith("increment_variant_replies", {
      p_variant_id: "variant-1",
    });
  });

  it("works without messageId and still cancels queued messages", async () => {
    const { handleLeadReply } = await import("@/lib/reply-handler");

    const result = await handleLeadReply({
      leadId: "lead-1",
      channel: "sms",
    });

    expect(result.paused).toBe(true);
    // Should not increment variant replies (no message to track)
    expect(mockRpc).not.toHaveBeenCalledWith(
      "increment_variant_replies",
      expect.anything()
    );
  });
});
