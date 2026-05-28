"use client";
import { X, AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "warning",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "warning" | "danger";
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-slate-900/40">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div
          className={`w-12 h-12 rounded-2xl grid place-items-center mb-4 ${
            variant === "danger"
              ? "bg-rose-50 text-rose-500"
              : "bg-amber-50 text-amber-500"
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "primary" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={variant === "danger" ? "!bg-rose-500 !shadow-none hover:!bg-rose-600" : ""}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
