import type { ReactNode } from "react";

type TopBarProps = {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  sticky?: boolean;
  className?: string;
};

export function TopBar({
  leftSlot,
  centerSlot,
  rightSlot,
  sticky = false,
  className = "",
}: TopBarProps) {
  const positionClass = sticky ? "sticky top-0" : "relative";
  
  return (
    <header
      className={`${positionClass} z-20 flex h-12 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md ${className}`}
    >
      <div className="flex min-w-[2rem] items-center justify-start">
        {leftSlot}
      </div>
      <div className="flex flex-1 items-center justify-center">
        {centerSlot}
      </div>
      <div className="flex min-w-[2rem] items-center justify-end">
        {rightSlot}
      </div>
    </header>
  );
}
