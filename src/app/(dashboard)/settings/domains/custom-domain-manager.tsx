"use client";

import { useState } from "react";
import type { CustomDomain } from "@/types/database";

interface Props {
  businessId: string;
  initialDomain: CustomDomain | null;
}

export function CustomDomainManager({ initialDomain }: Props) {
  const [domain, setDomain] = useState<CustomDomain | null>(initialDomain);
  const [domainInput, setDomainInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [provisioningSSL, setProvisioningSSL] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [copied, setCopied] = useState(false);

  const domainRegex =
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

  async function handleAddDomain() {
    setError(null);
    const cleaned = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");

    if (!domainRegex.test(cleaned)) {
      setError("Please enter a valid domain (e.g. app.yourbusiness.com)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleaned }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to add domain");
        return;
      }

      setDomain(data.domain);
      setDomainInput("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyDNS() {
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/custom-domain/verify", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }

      if (data.verified) {
        setDomain((prev) =>
          prev
            ? {
                ...prev,
                verified: true,
                verified_at: new Date().toISOString(),
              }
            : prev
        );
      } else {
        setError(
          data.message ?? "DNS record not found. Please check your settings."
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleProvisionSSL() {
    setError(null);
    setProvisioningSSL(true);
    try {
      const res = await fetch("/api/custom-domain/ssl", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "SSL provisioning failed");
        return;
      }

      if (data.ssl_provisioned) {
        setDomain((prev) =>
          prev ? { ...prev, ssl_provisioned: true } : prev
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setProvisioningSSL(false);
    }
  }

  async function handleRemoveDomain() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/custom-domain", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to remove domain");
        return;
      }

      setDomain(null);
      setConfirmRemove(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToken() {
    if (domain?.verification_token) {
      navigator.clipboard.writeText(domain.verification_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // No domain configured — show add form
  if (!domain) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-900">
            No custom domain configured
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Add your own domain to serve Captivly pages from a branded URL.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <label className="block text-sm font-medium text-slate-900">
            Domain
          </label>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => {
              setDomainInput(e.target.value);
              setError(null);
            }}
            placeholder="app.yourbusiness.com"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleAddDomain}
            disabled={loading || !domainInput.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Domain"}
          </button>
        </div>
      </div>
    );
  }

  // Domain exists — show status and actions
  const isFullyActive = domain.verified && domain.ssl_provisioned;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Domain status card */}
      <div className="rounded-lg border px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {domain.domain}
            </p>
            <p className="text-xs text-slate-500">
              Added {new Date(domain.created_at).toLocaleDateString()}
            </p>
          </div>
          {isFullyActive && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Active
            </span>
          )}
        </div>

        {/* 3-step progress indicator */}
        <div className="space-y-3">
          <StepIndicator
            step={1}
            label="Domain Added"
            complete
          />
          <StepIndicator
            step={2}
            label="DNS Verified"
            complete={domain.verified}
          />
          <StepIndicator
            step={3}
            label="SSL Active"
            complete={domain.ssl_provisioned}
          />
        </div>
      </div>

      {/* DNS instructions — shown when not verified */}
      {!domain.verified && (
        <div className="space-y-3 rounded-lg border px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">
            Verify Domain Ownership
          </p>
          <p className="text-sm text-slate-600">
            Add a TXT record to your DNS settings to verify ownership of{" "}
            <span className="font-medium text-slate-900">{domain.domain}</span>.
          </p>

          <div className="overflow-x-auto rounded-md bg-slate-50 p-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium text-slate-500">
                  <th className="pb-2 pr-4">Field</th>
                  <th className="pb-2">Value</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Host / Name</td>
                  <td className="py-2 font-mono text-xs">
                    {domain.domain}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Type</td>
                  <td className="py-2">TXT</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Value</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-white px-2 py-1 text-xs font-mono">
                        {domain.verification_token}
                      </code>
                      <button
                        type="button"
                        onClick={copyToken}
                        className="rounded bg-white px-2 py-1 text-xs font-medium shadow-sm hover:bg-slate-100"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">TTL</td>
                  <td className="py-2">300 (or lowest available)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-500">
            DNS changes can take up to 48 hours to propagate.
          </p>

          <button
            type="button"
            onClick={handleVerifyDNS}
            disabled={verifying}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {verifying ? "Checking DNS..." : "Verify DNS"}
          </button>
        </div>
      )}

      {/* SSL provisioning — shown when verified but SSL not active */}
      {domain.verified && !domain.ssl_provisioned && (
        <div className="space-y-3 rounded-lg border px-4 py-4">
          <p className="text-sm font-semibold text-slate-900">
            Provision SSL Certificate
          </p>
          <p className="text-sm text-slate-600">
            Your domain has been verified. Provision an SSL certificate to enable
            HTTPS for your custom domain.
          </p>
          <button
            type="button"
            onClick={handleProvisionSSL}
            disabled={provisioningSSL}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {provisioningSSL ? "Provisioning..." : "Provision SSL Certificate"}
          </button>
        </div>
      )}

      {/* Fully active state */}
      {isFullyActive && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">
          <p className="text-sm font-semibold text-green-800">
            Domain is live
          </p>
          <p className="mt-1 text-sm text-green-700">
            Your custom domain{" "}
            <span className="font-medium">{domain.domain}</span> is fully
            configured and accessible over HTTPS.
          </p>
        </div>
      )}

      {/* Remove domain */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Remove Domain</p>
            <p className="text-xs text-slate-500">
              This will disconnect your custom domain from Captivly.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveDomain}
            onBlur={() => setConfirmRemove(false)}
            disabled={loading}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading
              ? "Removing..."
              : confirmRemove
                ? "Click again to confirm"
                : "Remove Domain"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  complete,
}: {
  step: number;
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
          complete
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {complete ? (
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className={`text-sm ${
          complete
            ? "font-medium text-green-700"
            : "font-medium text-yellow-700"
        }`}
      >
        {label}
      </span>
      {!complete && (
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
          Pending
        </span>
      )}
    </div>
  );
}
