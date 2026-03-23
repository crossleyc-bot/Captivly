"use client";

const LOGOS: { name: string; icon: React.ReactNode }[] = [
  {
    name: "CrossFit Apex",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>
    ),
  },
  {
    name: "Glow Studio",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 9.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-5 1c-1.83 0-5.5.92-5.5 2.75V15h11v-1.75c0-1.83-3.67-2.75-5.5-2.75zm5 0c-.28 0-.59.02-.93.06.55.59 1.18 1.32 1.18 2.19V15h5.25v-1.75c0-1.83-3.67-2.75-5.5-2.75z"/></svg>
    ),
  },
  {
    name: "ProClean Services",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    ),
  },
  {
    name: "FitZone Gym",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>
    ),
  },
  {
    name: "Bella Salon & Spa",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
    ),
  },
  {
    name: "Peak Roofing",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
    ),
  },
  {
    name: "Urban Eats",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>
    ),
  },
  {
    name: "Elite Fitness",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>
    ),
  },
];

export function LogoTicker() {
  return (
    <div className="relative overflow-hidden py-6">
      {/* Gradient masks on edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />

      <div className="logo-ticker flex w-max gap-12">
        {/* Duplicate the list for seamless loop */}
        {[...LOGOS, ...LOGOS].map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex items-center gap-2 text-slate-400 transition-colors hover:text-slate-600"
          >
            {logo.icon}
            <span className="whitespace-nowrap text-sm font-medium">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
