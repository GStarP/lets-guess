import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonVariant = "ghost" | "surface";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
};

export function IconButton({
  icon,
  label,
  variant = "ghost",
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  const baseClass =
    "inline-flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  const variantClasses = {
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    surface: "bg-white/90 shadow-sm backdrop-blur-sm hover:scale-110",
  };

  const defaultSize = className.includes("h-") ? "" : "h-8 w-8";
  const rounded = className.includes("rounded") ? "" : "rounded-full";

  return (
    <button
      type={type}
      aria-label={label}
      className={`${baseClass} ${variantClasses[variant]} ${defaultSize} ${rounded} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
