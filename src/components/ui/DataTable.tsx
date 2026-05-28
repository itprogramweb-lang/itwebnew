"use client";
import { Search, Plus } from "lucide-react";
import Button from "./Button";
import { ReactNode } from "react";

export function DashboardPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "ค้นหา...",
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-3 mb-4 flex flex-wrap gap-3 items-center">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 h-10 text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition"
        />
      </div>
      {children}
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-slate-50 border border-slate-100 rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-brand-300 focus:bg-white transition"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function AddButton({
  onClick,
  label = "เพิ่มข้อมูล",
  disabled,
}: {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      size="md"
      disabled={disabled}
      title={disabled ? "จะเปิดใช้งานในรอบถัดไป" : undefined}
    >
      <Plus className="w-4 h-4" />
      {label}
    </Button>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, label = "ไม่พบข้อมูล" }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {label}
      </td>
    </tr>
  );
}
