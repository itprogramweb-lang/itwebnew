"use client";

import { FileText } from "lucide-react";
import CroppedImage from "@/components/ui/CroppedImage";
import type { StudentWorkRow } from "@/lib/supabase/queries";
import { resolveStudentWorkPdfUrl } from "./pdfLinks";

const workFallback = "/placeholders/student-work-placeholder.svg";

type StudentWorkCoverProps = {
  work: Pick<StudentWorkRow, "title" | "image_url" | "image_alt" | "image_crop_settings" | "pdf_url">;
  className?: string;
  interactive?: boolean;
};

export default function StudentWorkCover({
  work,
  className = "h-40 w-full rounded-none bg-slate-100",
  interactive = false,
}: StudentWorkCoverProps) {
  const pdfUrl = resolveStudentWorkPdfUrl(work.pdf_url);
  const transitionClass = interactive ? " transition-transform duration-300 group-hover:scale-105" : "";

  if (work.image_url) {
    return (
      <CroppedImage
        src={work.image_url}
        fallbackSrc={workFallback}
        alt={work.image_alt || work.title}
        crop={work.image_crop_settings}
        className={`${className}${transitionClass}`}
      />
    );
  }

  if (pdfUrl) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#f1f5f9_100%)]" />
        <div className="absolute inset-x-6 top-5 h-2 rounded-full bg-white/80" />
        <div className="absolute inset-x-8 top-10 h-2 rounded-full bg-white/70" />
        <div className="absolute inset-x-10 top-[3.75rem] h-2 rounded-full bg-white/60" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-brand-700 shadow-sm">
          <FileText className="h-8 w-8" />
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
          PDF
        </div>
      </div>
    );
  }

  return (
    <CroppedImage
      src={null}
      fallbackSrc={workFallback}
      alt={work.image_alt || work.title}
      crop={work.image_crop_settings}
      className={`${className}${transitionClass}`}
    />
  );
}
