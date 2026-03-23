"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}

export function FadeIn({
  children,
  className = "",
  stagger = false,
}: FadeInProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`fade-in-up ${stagger ? "stagger-children" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
