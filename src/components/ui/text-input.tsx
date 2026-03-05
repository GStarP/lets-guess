import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({
  className = "",
  type = "text",
  ...props
}: TextInputProps) {
  return (
    <input
      type={type}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/15 ${className}`}
      {...props}
    />
  );
}
