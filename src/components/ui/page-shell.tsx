import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  variant?: "gray" | "slate";
  className?: string;
};

export function PageShell({
  children,
  variant = "gray",
  className = "",
}: PageShellProps) {
  const bgClass = variant === "slate" ? "bg-slate-50" : "bg-gray-50";

  return (
    <section
      className={`relative flex h-full w-full flex-col ${bgClass} ${className}`}
    >
      {children}
    </section>
  );
}
