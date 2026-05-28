"use client";
import Link from "next/link";
import { Menu, ExternalLink } from "lucide-react";
import type { User } from "@/types";
import { roleLabels } from "@/data/users";

export default function DashboardHeader({
  user,
  onMenuClick,
}: {
  user: User;
  onMenuClick: () => void;
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-6 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
        aria-label="เปิดเมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <Link
        href="/"
        target="_blank"
        className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand-600 mr-4"
      >
        ดูเว็บไซต์
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>

      <div className="flex items-center gap-2.5">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-slate-900 leading-tight">
            {user.name}
          </div>
          <div className="text-xs text-slate-500">{roleLabels[user.role]}</div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-brand-gradient grid place-items-center text-white font-bold text-sm">
          {user.name.charAt(0)}
        </div>
      </div>
    </header>
  );
}
