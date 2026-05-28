import Link from "next/link";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbTrailProps = {
  items: BreadcrumbItem[];
  backHref?: string;
  backLabel?: string;
  dark?: boolean;
  className?: string;
};

export default function BreadcrumbTrail({
  items,
  backHref,
  backLabel = "ย้อนกลับ",
  dark = false,
  className,
}: BreadcrumbTrailProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-full min-w-0 flex-col items-center gap-1.5 text-[11px] leading-5 sm:flex-row sm:justify-center sm:gap-1.5 sm:text-[13px]",
        className
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          className={cn(
            "inline-flex min-h-9 max-w-full shrink-0 items-center justify-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border px-2 py-1.5 font-medium leading-5 transition-colors sm:min-h-8 sm:max-w-none sm:gap-1.5 sm:px-3",
            dark
              ? "border-white/10 bg-white/10 text-slate-100 hover:bg-white/15"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <ArrowLeft className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          {backLabel}
        </Link>
      )}

      <nav
        aria-label="Breadcrumb"
        className={cn(
          "flex min-h-9 w-full max-w-full min-w-0 items-center overflow-x-auto rounded-full border px-2 py-1.5 leading-5 sm:min-h-8 sm:w-auto sm:max-w-[min(80vw,900px)] sm:px-3",
          dark
            ? "border-white/10 bg-white/10 text-slate-300 backdrop-blur"
            : "border-slate-200 bg-white/90 text-slate-600 shadow-sm"
        )}
      >
        <ol className="flex min-w-max items-center gap-1 whitespace-nowrap leading-5">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isCurrent = index === items.length - 1;
            const isClickable = Boolean(item.href) && !isCurrent;
            const content = (
              <span className="inline-flex shrink-0 items-center gap-1 leading-5">
                {isFirst && <Home className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />}
                <span
                  className={cn(
                    "whitespace-nowrap leading-5",
                    isCurrent && "shrink-0 sm:max-w-sm sm:truncate"
                  )}
                >
                  {item.label}
                </span>
              </span>
            );

            return (
              <li key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-1 leading-5">
                {index > 0 && (
                  <ChevronRight
                    className={cn("h-3 w-3 shrink-0 self-center", dark ? "text-slate-500" : "text-slate-400")}
                    aria-hidden="true"
                  />
                )}
                {isClickable ? (
                  <Link
                    href={item.href!}
                    className={cn(
                      "min-w-0 leading-5 transition-colors",
                      dark ? "hover:text-white" : "hover:text-brand-600"
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "min-w-0 leading-5",
                      isCurrent
                        ? cn("font-medium", dark ? "text-white" : "text-slate-900")
                        : dark
                          ? "text-slate-300"
                          : "text-slate-600"
                    )}
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
