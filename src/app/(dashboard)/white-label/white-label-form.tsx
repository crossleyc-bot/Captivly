"use client";

import { useState } from "react";

interface WhiteLabelFormProps {
  initialConfig: {
    app_name: string;
    logo_url: string | null;
    primary_color: string;
    accent_color: string;
    favicon_url: string | null;
    hide_captivly_branding: boolean;
  };
}

export function WhiteLabelForm({ initialConfig }: WhiteLabelFormProps) {
  const [appName, setAppName] = useState(initialConfig.app_name);
  const [logoUrl, setLogoUrl] = useState(initialConfig.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(initialConfig.primary_color);
  const [accentColor, setAccentColor] = useState(initialConfig.accent_color);
  const [faviconUrl, setFaviconUrl] = useState(initialConfig.favicon_url ?? "");
  const [hideBranding, setHideBranding] = useState(initialConfig.hide_captivly_branding);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/white-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName,
          logo_url: logoUrl || undefined,
          primary_color: primaryColor,
          accent_color: accentColor,
          favicon_url: faviconUrl || undefined,
          hide_captivly_branding: hideBranding,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Preview */}
      <div className="rounded-lg border p-4">
        <p className="mb-2 text-xs font-medium text-slate-500 uppercase">Preview</p>
        <div className="flex items-center gap-3 rounded-md p-3" style={{ backgroundColor: primaryColor }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded object-cover" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {appName.charAt(0)}
            </div>
          )}
          <span className="text-lg font-bold text-white">{appName || "Your App"}</span>
        </div>
      </div>

      {/* App name */}
      <div>
        <label htmlFor="wl-name" className="block text-sm font-medium">
          App Name
        </label>
        <input
          id="wl-name"
          type="text"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Your Brand Name"
        />
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="wl-logo" className="block text-sm font-medium">
          Logo URL
        </label>
        <input
          id="wl-logo"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="https://example.com/logo.png"
        />
        <p className="mt-1 text-xs text-slate-400">Recommended: 200x200px PNG or SVG</p>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="wl-primary" className="block text-sm font-medium">
            Primary Color
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="wl-primary"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border p-0.5"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label htmlFor="wl-accent" className="block text-sm font-medium">
            Accent Color
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id="wl-accent"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border p-0.5"
            />
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* Favicon URL */}
      <div>
        <label htmlFor="wl-favicon" className="block text-sm font-medium">
          Favicon URL
        </label>
        <input
          id="wl-favicon"
          type="url"
          value={faviconUrl}
          onChange={(e) => setFaviconUrl(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="https://example.com/favicon.ico"
        />
      </div>

      {/* Hide branding */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={hideBranding}
          onChange={(e) => setHideBranding(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <span className="text-sm">Hide &quot;Powered by Captivly&quot; branding</span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Branding saved successfully!</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Branding"}
      </button>
    </form>
  );
}
