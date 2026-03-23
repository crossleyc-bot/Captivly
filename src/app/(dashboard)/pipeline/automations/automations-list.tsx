"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PipelineStage, PipelineAutomationAction, LeadStatus } from "@/types/database";

interface AutomationWithStage {
  id: string;
  name: string;
  trigger_stage_id: string;
  action_type: PipelineAutomationAction;
  action_config: Record<string, string>;
  is_active: boolean;
  created_at: string;
  stage: { id: string; name: string; color: string } | null;
}

const ACTION_LABELS: Record<PipelineAutomationAction, string> = {
  send_email: "Send Email",
  send_sms: "Send SMS",
  update_lead_status: "Update Lead Status",
  create_activity_note: "Add Activity Note",
};

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_sequence", label: "In Sequence" },
  { value: "replied", label: "Replied" },
  { value: "converted", label: "Converted" },
  { value: "cold", label: "Cold" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

export function AutomationsList({
  automations: initialAutomations,
  stages,
}: {
  automations: AutomationWithStage[];
  stages: PipelineStage[];
}) {
  const router = useRouter();
  const [automations, setAutomations] = useState(initialAutomations);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [triggerStageId, setTriggerStageId] = useState(stages[0]?.id ?? "");
  const [actionType, setActionType] = useState<PipelineAutomationAction>("send_email");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [leadStatus, setLeadStatus] = useState<LeadStatus>("converted");
  const [noteContent, setNoteContent] = useState("");

  function resetForm() {
    setName("");
    setTriggerStageId(stages[0]?.id ?? "");
    setActionType("send_email");
    setEmailSubject("");
    setEmailBody("");
    setSmsBody("");
    setLeadStatus("converted");
    setNoteContent("");
    setShowForm(false);
  }

  async function handleCreate() {
    if (!name.trim()) return;

    let action_config: Record<string, string> = {};
    switch (actionType) {
      case "send_email":
        if (!emailSubject.trim() || !emailBody.trim()) return;
        action_config = { subject: emailSubject.trim(), body: emailBody.trim() };
        break;
      case "send_sms":
        if (!smsBody.trim()) return;
        action_config = { body: smsBody.trim() };
        break;
      case "update_lead_status":
        action_config = { lead_status: leadStatus };
        break;
      case "create_activity_note":
        if (!noteContent.trim()) return;
        action_config = { note: noteContent.trim() };
        break;
    }

    setSaving(true);
    const res = await fetch("/api/pipeline-automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        trigger_stage_id: triggerStageId,
        action_type: actionType,
        action_config,
      }),
    });

    if (res.ok) {
      resetForm();
      router.refresh();
    }
    setSaving(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    setTogglingId(id);
    const res = await fetch("/api/pipeline-automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !currentActive }),
    });
    if (res.ok) {
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a))
      );
    }
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/pipeline-automations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New Automation
        </button>
      ) : (
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="text-sm font-semibold">New Automation</h3>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600">Name</label>
            <input
              type="text"
              placeholder='e.g. "Send confirmation when appointment set"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          {/* Trigger stage */}
          <div>
            <label className="block text-xs font-medium text-slate-600">
              When a deal moves to...
            </label>
            <select
              value={triggerStageId}
              onChange={(e) => setTriggerStageId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action type */}
          <div>
            <label className="block text-xs font-medium text-slate-600">Then...</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as PipelineAutomationAction)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Action-specific config */}
          {actionType === "send_email" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">Email Subject</label>
                <input
                  type="text"
                  placeholder="Your appointment is confirmed!"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Email Body</label>
                <textarea
                  placeholder={"Hi {{first_name}}, your appointment has been confirmed..."}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Available variables: {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"}, {"{{phone}}"}
                </p>
              </div>
            </div>
          )}

          {actionType === "send_sms" && (
            <div>
              <label className="block text-xs font-medium text-slate-600">SMS Message</label>
              <textarea
                placeholder={"Hi {{first_name}}, your appointment is confirmed!"}
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Available variables: {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"}, {"{{phone}}"}
              </p>
            </div>
          )}

          {actionType === "update_lead_status" && (
            <div>
              <label className="block text-xs font-medium text-slate-600">Set Lead Status To</label>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === "create_activity_note" && (
            <div>
              <label className="block text-xs font-medium text-slate-600">Note Content</label>
              <textarea
                placeholder="Appointment confirmed, ready for follow-up call."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Available variables: {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"}, {"{{phone}}"}
              </p>
            </div>
          )}

          {/* Form actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Automation"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Automations list */}
      {automations.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No automations yet. Create one to trigger actions when deals move through your pipeline.
          </p>
        </div>
      )}

      {automations.length > 0 && (
        <div className="space-y-3">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className={`rounded-lg border px-4 py-3 ${
                automation.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      automation.is_active ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{automation.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      When deal moves to{" "}
                      <span className="font-medium">
                        {automation.stage?.name ?? "Unknown"}
                      </span>
                      {" → "}
                      <span className="font-medium">
                        {ACTION_LABELS[automation.action_type]}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(automation.id, automation.is_active)}
                    disabled={togglingId === automation.id}
                    className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {togglingId === automation.id
                      ? "..."
                      : automation.is_active
                        ? "Pause"
                        : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(automation.id)}
                    disabled={deletingId === automation.id}
                    className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === automation.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
