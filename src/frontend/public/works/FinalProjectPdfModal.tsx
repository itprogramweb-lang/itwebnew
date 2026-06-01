"use client";

import { useEffect } from "react";
import { Download, ExternalLink, FileWarning, X } from "lucide-react";

type FinalProjectPdfModalProps = {
  open: boolean;
  title: string;
  pdfUrl: string | null;
  pdfFilename?: string | null;
  onClose: () => void;
};

export default function FinalProjectPdfModal({
  open,
  title,
  pdfUrl,
  pdfFilename,
  onClose,
}: FinalProjectPdfModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-project-pdf-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-0 sm:px-4 sm:pb-6 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="flex h-dvh w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100vh-6rem)] sm:max-w-6xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-brand-700">เล่มผลงานนักศึกษา</p>
            <h2 id="final-project-pdf-title" className="mt-1 line-clamp-2 text-base font-semibold leading-snug text-slate-900 sm:text-lg">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500">ถ้าไฟล์ไม่แสดง ให้ลองเปิดในแท็บใหม่</p>
          {pdfUrl && (
            <div className="notranslate flex flex-wrap gap-2" translate="no">
              <a
                href={pdfUrl}
                download={pdfFilename ?? undefined}
                translate="no"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
              >
                <Download className="h-3.5 w-3.5" />
                ดาวน์โหลด PDF
              </a>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                เปิดในแท็บใหม่
              </a>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
          {pdfUrl ? (
            <object data={pdfUrl} type="application/pdf" className="notranslate h-[calc(100dvh-11rem)] min-h-[420px] w-full rounded-xl border border-slate-200 bg-white sm:h-[calc(100vh-15rem)] sm:min-h-[520px]" translate="no">
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl bg-white px-6 text-center">
                <FileWarning className="mb-4 h-10 w-10 text-slate-300" />
                <h3 className="font-semibold text-slate-900">ไม่สามารถแสดง PDF ในหน้านี้ได้</h3>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  ถ้าไฟล์ไม่แสดง ให้ลองเปิดในแท็บใหม่
                </p>
              </div>
            </object>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center">
              <FileWarning className="mb-4 h-10 w-10 text-slate-300" />
              <h3 className="font-semibold text-slate-900">ไม่พบไฟล์ PDF</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
