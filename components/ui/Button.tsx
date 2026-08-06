import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-gold text-stone-950",
  secondary: "border border-border bg-transparent text-stone-100",
  danger: "border border-negative/40 bg-transparent text-negative",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}
