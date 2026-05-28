"use client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  title?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-sm shadow-orange-900/20 hover:brightness-105 active:scale-[0.98]",
  secondary:
    "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:scale-[0.98]",
  outline:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98]",
  ghost: "text-slate-700 hover:bg-slate-100 active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-[var(--site-button-radius)]",
  md: "h-11 px-5 text-sm rounded-[var(--site-button-radius)]",
  lg: "h-12 px-6 text-base rounded-[var(--site-button-radius)]",
};

export default function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className,
  fullWidth,
  title,
}: Props) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    disabled && "pointer-events-none opacity-55 grayscale",
    className
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={cls}>
      {children}
    </button>
  );
}
