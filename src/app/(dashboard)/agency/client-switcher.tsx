"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClientBusiness {
  id: string;
  name: string;
  type: string;
}

interface ClientSwitcherProps {
  clients: ClientBusiness[];
  currentClientId?: string | null;
}

export function ClientSwitcher({ clients, currentClientId }: ClientSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentClient = currentClientId
    ? clients.find((c) => c.id === currentClientId) ?? null
    : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(clientId: string | null) {
    setOpen(false);
    if (clientId === null) {
      router.push("/agency/overview");
    } else {
      router.push(`/agency/clients/${clientId}`);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm hover:bg-slate-50 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      >
        <span className="truncate">
          {currentClient ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{currentClient.name}</span>
              <span className="text-xs text-slate-400">{currentClient.type}</span>
            </span>
          ) : (
            <span className="text-slate-500">All Clients</span>
          )}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          <div className="max-h-64 overflow-y-auto py-1">
            {/* All Clients option */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                !currentClientId ? "bg-blue-50 font-medium text-blue-700" : "text-slate-700"
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              All Clients
            </button>

            {clients.length > 0 && (
              <div className="border-t border-slate-100" />
            )}

            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  currentClientId === client.id
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-slate-700"
                }`}
              >
                <span className="truncate">{client.name}</span>
                <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {client.type}
                </span>
              </button>
            ))}

            {clients.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">No clients yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
