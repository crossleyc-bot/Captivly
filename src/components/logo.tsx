/** Captivly signal-pulse logo icon as an inline SVG. */
export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="26" r="3.5" fill="currentColor" />
      <path
        d="M14 26a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M21 26a15 15 0 0 0-15-15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      <path
        d="M28 26a22 22 0 0 0-22-22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      />
    </svg>
  );
}

/** Full Captivly wordmark: icon + text. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoIcon size={size} className="text-indigo-600" />
      <span className="text-xl font-bold tracking-tight">Captivly</span>
    </span>
  );
}
