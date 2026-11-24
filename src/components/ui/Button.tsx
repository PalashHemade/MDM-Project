import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex items-center justify-center rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-red text-white hover:bg-[#9c3625] active:bg-[#8a2f20]",
  secondary: "border border-border bg-card text-ink hover:bg-ground hover:border-ink/30 active:bg-border/40",
  ghost: "text-ink-soft hover:text-ink hover:bg-ground",
  danger: "text-red hover:bg-red-tint",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
