"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithCsrf } from "@/lib/fetch-with-csrf";
import type { PipelineStage } from "@/types/database";

export function DealActions({
  dealId,
  stages,
  currentStageId,
}: {
  dealId: string;
  stages: PipelineStage[];
  currentStageId: string | null;
}) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function moveToStage(stageId: string) {
    if (stageId === currentStageId) return;
    setMoving(true);
    setError(null);
    const res = await fetchWithCsrf("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dealId, stage_id: stageId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to move deal" }));
      setError(data.error ?? "Failed to move deal");
    }
    setMoving(false);
    router.refresh();
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetchWithCsrf("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dealId, notes: noteText.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Failed to save notes" }));
      setError(data.error ?? "Failed to save notes");
      setSaving(false);
      return;
    }

    setNoteText("");
    setAddingNote(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {/* Move stage */}
      <div>
        <h2 className="text-lg font-semibold">Move Stage</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => moveToStage(stage.id)}
              disabled={moving || stage.id === currentStageId}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                stage.id === currentStageId
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              {stage.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add note */}
      <div>
        {!addingNote ? (
          <button
            type="button"
            onClick={() => setAddingNote(true)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Update Notes
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add notes about this deal..."
              rows={3}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addNote}
                disabled={saving || !noteText.trim()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Notes"}
              </button>
              <button
                type="button"
                onClick={() => { setAddingNote(false); setNoteText(""); }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
