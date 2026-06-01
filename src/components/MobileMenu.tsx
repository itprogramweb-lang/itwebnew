"use client";

import Link from "next/link";
import { X, ChevronRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import PublicLanguageToggle, { getPublicNavLabel, type PublicLanguage } from "./PublicLanguageToggle";

type MenuItem =
  | { type: "link"; label: string; href: string; external?: boolean }
  | {
      type: "dropdown";
      label: string;
      items: { label: string; href: string; description?: string; external?: boolean }[];
    };

export default function MobileMenu({
  open,
  onClose,
  items,
  activePath,
  language,
}: {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
  activePath: string;
  language: PublicLanguage;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        translate="no"
        className={cn(
          "notranslate fixed top-0 right-0 bottom-0 z-[101] w-[88%] max-w-sm overflow-hidden bg-white shadow-2xl transition-transform lg:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="font-semibold text-slate-900">
            {language === "en" ? "Menu" : "เมนูทั้งหมด"}
          </div>
          <div className="flex items-center gap-2">
            <PublicLanguageToggle className="border-slate-200 bg-slate-900 text-slate-100" />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="ปิดเมนู"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {items.map((item) => {
            const label = getPublicNavLabel({
              href: item.type === "link" ? item.href : null,
              label: item.label,
              language,
            });

            if (item.type === "link") {
              if (item.external) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    translate="no"
                    className="flex items-center gap-2 rounded-2xl px-4 py-3 font-medium text-slate-800 hover:bg-slate-50"
                  >
                    {label}
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  translate="no"
                  className={cn(
                    "block rounded-2xl px-4 py-3 font-medium",
                    activePath === item.href
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-800 hover:bg-slate-50"
                  )}
                >
                  {label}
                </Link>
              );
            }
            const isOpen = expanded === item.label;
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpanded(isOpen ? null : item.label)}
                  translate="no"
                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 font-medium text-slate-800 hover:bg-slate-50"
                >
                  <span>{label}</span>
                  <ChevronRight
                    className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")}
                  />
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-slate-100 pl-2">
                    {item.items.map((sub) =>
                      {
                        const subLabel = getPublicNavLabel({
                          href: sub.href,
                          label: sub.label,
                          language,
                        });

                        return sub.external ? (
                          <a
                            key={sub.href}
                            href={sub.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            translate="no"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          >
                            {subLabel}
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </a>
                        ) : (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            translate="no"
                            className={cn(
                              "block rounded-xl px-3 py-2 text-sm",
                              activePath === sub.href
                                ? "bg-brand-50 text-brand-700"
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {subLabel}
                          </Link>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
