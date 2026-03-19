export const metadata = {
  title: "Chat",
};

export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout — no sidebar, no banner, just the widget
  return <>{children}</>;
}
