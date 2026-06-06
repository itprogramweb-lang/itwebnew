"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  dark = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-10 lg:mb-14",
        align === "center" && "text-center max-w-3xl mx-auto",
        className
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1 mb-4 text-xs font-medium",
            dark
              ? "border-white/10 bg-white/10 text-site-accent"
              : "border-site-primary bg-site-primary-soft",
            align === "center" && "mx-auto"
          )}
        >
          {eyebrow}
        </div>
      )}
      <h2
        className={cn(
        "text-2xl sm:text-3xl lg:text-4xl font-[var(--site-heading-weight,600)] leading-tight",
          dark ? "text-white" : "text-slate-900"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 text-base lg:text-lg leading-relaxed",
            dark ? "text-slate-300" : "text-slate-600"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  children,
  dark = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: ReactNode;
  children?: ReactNode;
  dark?: boolean;
}) {
  return (
    <>
      {breadcrumb && (
        <div
          className={cn(
            "sticky top-[72px] z-[70] border-b backdrop-blur-xl lg:top-[88px]",
            dark
              ? "border-white/10 bg-slate-950/90"
              : "border-slate-200 bg-white/90"
          )}
        >
          <div className="container-wide flex min-w-0 justify-center py-2 sm:py-1.5">{breadcrumb}</div>
        </div>
      )}

      <section
        className={cn(
          "relative overflow-hidden border-b",
          dark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"
        )}
      >
        {dark ? (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.16),transparent_38%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
            <div className="border-site-gradient-line absolute inset-x-0 bottom-0 h-px" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,237,213,0.78),rgba(248,250,252,0.92)_42%,#fff_100%)]" />
            <div className="border-site-gradient-line absolute inset-x-0 bottom-0 h-px" />
          </>
        )}

        <div className="container-wide relative py-12 sm:py-16 lg:py-20">
          {eyebrow && (
            <div
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 mb-4 text-xs font-medium",
                dark
                  ? "border-white/10 bg-white/10 text-site-accent backdrop-blur"
                  : "border-site-primary bg-white/80 text-site-primary backdrop-blur"
              )}
            >
              {eyebrow}
            </div>
          )}
          <h1
            className={cn(
              "max-w-3xl text-3xl font-[var(--site-heading-weight,600)] leading-tight sm:text-4xl lg:text-5xl",
              dark ? "text-white" : "text-slate-900"
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "mt-4 text-base lg:text-lg max-w-2xl leading-relaxed",
                dark ? "text-slate-300" : "text-slate-700"
              )}
            >
              {description}
            </p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </section>
    </>
  );
}


export function StatCard({
  label,
  value,
  icon,
  trend,
  dark = false,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--site-card-radius)] border p-5",
        dark
          ? "border-slate-800 bg-slate-900/80"
          : "border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]"
      )}
    >
      <div className={cn("text-xs mb-1", dark ? "text-slate-500" : "text-slate-500")}>
        {label}
      </div>
      <div
        className={cn(
          "text-2xl lg:text-3xl font-[var(--site-heading-weight,600)]",
          dark ? "text-white" : "text-slate-900"
        )}
      >
        {value}
      </div>
      <div className="flex items-end justify-between mt-1">
        {trend ? (
          <div className="text-xs text-emerald-400">{trend}</div>
        ) : (
          <div />
        )}
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-site-gradient grid place-items-center text-white shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
  dark = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "group rounded-[var(--site-card-radius)] border p-6 lg:p-7 card-hover",
        dark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-site-gradient grid place-items-center text-white shadow-sm mb-4 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3
        className={cn(
          "font-semibold text-lg mb-2",
          dark ? "text-white" : "text-slate-900"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed",
            dark ? "text-slate-300" : "text-slate-600"
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  dark = false,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-center py-16 px-6 rounded-2xl border border-dashed",
        dark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
      )}
    >
      {icon && (
        <div
          className={cn(
            "w-14 h-14 mx-auto mb-4 rounded-2xl grid place-items-center",
            dark ? "bg-slate-800 text-slate-500" : "bg-white text-slate-400"
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "font-semibold",
          dark ? "text-slate-300" : "text-slate-800"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-sm mt-1.5",
            dark ? "text-slate-500" : "text-slate-500"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
