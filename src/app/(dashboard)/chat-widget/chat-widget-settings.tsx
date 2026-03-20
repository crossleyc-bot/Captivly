"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  businessId: string;
  initialConfig: {
    is_enabled: boolean;
    greeting: string;
    accent_color: string;
    position: string;
  };
  embedCode: string;
}

export function ChatWidgetSettings({
  businessId,
  initialConfig,
  embedCode,
}: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    await supabase
      .from("chat_widget_config")
      .update({
        is_enabled: config.is_enabled,
        greeting: config.greeting,
        accent_color: config.accent_color,
        position: config.position,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Widget Status</p>
          <p className="text-sm text-zinc-500">
            {config.is_enabled
              ? "Widget is live on your site"
              : "Widget is disabled"}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setConfig((c) => ({ ...c, is_enabled: !c.is_enabled }))
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.is_enabled ? "bg-green-500" : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.is_enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Settings form */}
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <label className="block text-sm font-medium">Greeting Message</label>
          <input
            type="text"
            value={config.greeting}
            onChange={(e) =>
              setConfig((c) => ({ ...c, greeting: e.target.value }))
            }
            maxLength={200}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Accent Color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={config.accent_color}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, accent_color: e.target.value }))
                }
                className="h-9 w-9 cursor-pointer rounded border"
              />
              <input
                type="text"
                value={config.accent_color}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, accent_color: e.target.value }))
                }
                className="w-28 rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium">Position</label>
            <select
              value={config.position}
              onChange={(e) =>
                setConfig((c) => ({ ...c, position: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {/* Embed code */}
      <div className="space-y-2 rounded-lg border p-4">
        <p className="font-medium">Embed Code</p>
        <p className="text-sm text-zinc-500">
          Paste this snippet before the closing{" "}
          <code className="rounded bg-zinc-100 px-1">&lt;/body&gt;</code> tag on
          your website.
        </p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
            {embedCode}
          </pre>
          <button
            type="button"
            onClick={copyEmbed}
            className="absolute right-2 top-2 rounded bg-white px-2 py-1 text-xs font-medium shadow-sm hover:bg-zinc-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
