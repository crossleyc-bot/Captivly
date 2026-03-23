"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCents, scoreColor } from "@/lib/ui-utils";
import type { PipelineStage } from "@/types/database";

interface DealWithRelations {
  id: string;
  stage_id: string | null;
  title: string;
  value_cents: number;
  expected_close_date: string | null;
  created_at: string;
  lead: { id: string; first_name: string | null; last_name: string | null; email: string | null; ai_score: number | null } | null;
}

export function PipelineBoard({
  stages,
  deals: initialDeals,
}: {
  stages: PipelineStage[];
  deals: DealWithRelations[];
}) {
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [movingDealId, setMovingDealId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [newDealStageId, setNewDealStageId] = useState(stages[0]?.id ?? "");
  const [creating, setCreating] = useState(false);
  const dragDealRef = useRef<string | null>(null);
  const dragSourceStageRef = useRef<string | null>(null);

  const moveDeal = useCallback(async (dealId: string, stageId: string) => {
    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d))
    );
    setMovingDealId(dealId);

    const res = await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dealId, stage_id: stageId }),
    });

    setMovingDealId(null);

    if (!res.ok) {
      // Revert on failure
      router.refresh();
    }
  }, [router]);

  async function createDeal() {
    if (!newDealTitle.trim()) return;
    setCreating(true);
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newDealTitle.trim(),
        value_cents: Math.round((parseFloat(newDealValue) || 0) * 100),
        stage_id: newDealStageId || undefined,
      }),
    });
    if (res.ok) {
      const deal = await res.json();
      setDeals((prev) => [{ ...deal, lead: null }, ...prev]);
    }
    setNewDealTitle("");
    setNewDealValue("");
    setShowNewDeal(false);
    setCreating(false);
  }

  // --- Drag and Drop handlers ---

  function handleDragStart(e: React.DragEvent, dealId: string, stageId: string | null) {
    dragDealRef.current = dealId;
    dragSourceStageRef.current = stageId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dealId);

    // Make the dragged element semi-transparent after a tick
    const target = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      target.style.opacity = "0.4";
    });
  }

  function handleDragEnd(e: React.DragEvent) {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
    dragDealRef.current = null;
    dragSourceStageRef.current = null;
    setDragOverStageId(null);
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  }

  function handleDragLeave(e: React.DragEvent, stageId: string) {
    // Only clear if we're actually leaving this column (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      if (dragOverStageId === stageId) {
        setDragOverStageId(null);
      }
    }
  }

  function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setDragOverStageId(null);

    const dealId = dragDealRef.current;
    if (!dealId) return;

    // Don't do anything if dropped on the same stage
    if (dragSourceStageRef.current === stageId) return;

    moveDeal(dealId, stageId);
  }

  return (
    <div className="space-y-4">
      {/* Add deal button */}
      {!showNewDeal ? (
        <button
          type="button"
          onClick={() => setShowNewDeal(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New Deal
        </button>
      ) : (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-semibold">New Deal</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Deal title"
              value={newDealTitle}
              onChange={(e) => setNewDealTitle(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <input
              type="number"
              placeholder="Value ($)"
              value={newDealValue}
              onChange={(e) => setNewDealValue(e.target.value)}
              min="0"
              step="1"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <select
              value={newDealStageId}
              onChange={(e) => setNewDealStageId(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createDeal}
              disabled={creating || !newDealTitle.trim()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowNewDeal(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value_cents ?? 0), 0);
          const isDropTarget = dragOverStageId === stage.id && dragSourceStageRef.current !== stage.id;

          return (
            <div
              key={stage.id}
              className={`min-w-[280px] flex-shrink-0 rounded-lg border transition-colors duration-150 ${
                isDropTarget
                  ? "border-teal-400 bg-teal-50/50 ring-2 ring-teal-200"
                  : "bg-slate-50"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column header */}
              <div className="border-b px-3 py-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-semibold">{stage.name}</span>
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {stageDeals.length}
                  </span>
                </div>
                {stageValue > 0 && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatCents(stageValue)}
                  </p>
                )}
              </div>

              {/* Deal cards */}
              <div className="space-y-2 p-2" style={{ minHeight: "80px" }}>
                {stageDeals.length === 0 && !isDropTarget && (
                  <p className="px-2 py-4 text-center text-xs text-slate-400">
                    No deals
                  </p>
                )}
                {isDropTarget && stageDeals.length === 0 && (
                  <div className="rounded-md border-2 border-dashed border-teal-300 px-2 py-4 text-center text-xs text-teal-500">
                    Drop here
                  </div>
                )}
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable={!stage.is_won && !stage.is_lost}
                    onDragStart={(e) => handleDragStart(e, deal.id, stage.id)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-md border bg-white p-3 shadow-sm transition-opacity ${
                      movingDealId === deal.id ? "opacity-50" : ""
                    } ${!stage.is_won && !stage.is_lost ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    <Link
                      href={`/deals/${deal.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-teal-600"
                    >
                      {deal.title}
                    </Link>
                    {deal.value_cents > 0 && (
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">
                        {formatCents(deal.value_cents)}
                      </p>
                    )}
                    {deal.lead && (
                      <p className="mt-1 text-xs text-slate-500">
                        <Link href={`/leads/${deal.lead.id}`} className="hover:text-teal-600">
                          {deal.lead.first_name ?? "Unknown"} {deal.lead.last_name ?? ""}
                        </Link>
                        {deal.lead.ai_score !== null && (
                          <span className={`ml-1 font-semibold ${scoreColor(deal.lead.ai_score)}`}>
                            ({deal.lead.ai_score}/10)
                          </span>
                        )}
                      </p>
                    )}
                    {deal.expected_close_date && (
                      <p className="mt-1 text-xs text-slate-400">
                        Close: {new Date(deal.expected_close_date).toLocaleDateString()}
                      </p>
                    )}

                    {/* Quick stage move buttons (kept as fallback alongside drag) */}
                    {!stage.is_won && !stage.is_lost && (
                      <div className="mt-2 flex gap-1">
                        {stages
                          .filter((s) => s.id !== stage.id)
                          .slice(0, 3)
                          .map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => moveDeal(deal.id, s.id)}
                              disabled={movingDealId === deal.id}
                              className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-700 disabled:opacity-50"
                              title={`Move to ${s.name}`}
                            >
                              <span
                                className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.name.length > 10 ? s.name.slice(0, 10) + "..." : s.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
