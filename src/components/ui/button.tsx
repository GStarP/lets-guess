import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseClass =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  const variantClasses = {
    primary: "bg-black text-white hover:bg-slate-900 disabled:bg-slate-300",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  };

  const widthClass = fullWidth ? "w-full" : "";
  // Default padding if not overridden
  const paddingClass =
    className.includes("p-") || className.includes("px-") ? "" : "px-4 py-3";

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClasses[variant]} ${widthClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
