"use client";

import { createContext, useContext } from "react";

export interface BrandingConfig {
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  favicon_url: string | null;
  hide_captivly_branding: boolean;
}

const defaultBranding: BrandingConfig = {
  app_name: "Captivly.ai",
  logo_url: null,
  primary_color: "#4f46e5",
  accent_color: "#6366f1",
  favicon_url: null,
  hide_captivly_branding: false,
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

export function BrandingProvider({
  branding,
  children,
}: {
  branding: BrandingConfig | null;
  children: React.ReactNode;
}) {
  return (
    <BrandingContext.Provider value={branding ?? defaultBranding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
