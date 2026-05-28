"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FileText, GraduationCap, Users } from "lucide-react";
import type { StudentWorkRow } from "@/lib/supabase/queries";
import { buildPdfViewerHref, resolveStudentWorkPdfUrl } from "./pdfLinks";
import FinalProjectPdfModal from "./FinalProjectPdfModal";
import StudentWorkCover from "./StudentWorkCover";

export default function FinalProjectWorkCard({ work }: { work: StudentWorkRow }) {
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const detailHref = work.slug ? `/works/students/${work.slug}` : null;
  const returnTo = work.academic_year
    ? `/works/students/final-projects/${encodeURIComponent(work.academic_year)}`
    : "/works/students/final-projects";
  const pdfViewerHref = buildPdfViewerHref({
    file: work.pdf_url,
    title: work.title,
    filename: work.pdf_filename,
    returnTo,
    returnLabel: "กลับไปปริญญานิพนธ์ (Thesis)",
    source: "final_project",
  });
  const pdfUrl = resolveStudentWorkPdfUrl(work.pdf_url);

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/70 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg">
        {detailHref ? (
          <Link href={detailHref} className="block overflow-hidden">
            <StudentWorkCover work={work} interactive />
          </Link>
        ) : (
          <StudentWorkCover work={work} />
        )}

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
              {work.category || "ปริญญานิพนธ์ (Thesis)"}
            </span>
            {work.academic_year && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                ปีการศึกษา {work.academic_year}
              </span>
            )}
          </div>

          {detailHref ? (
            <Link href={detailHref} className="block">
              <h2 className="break-words text-[15px] font-semibold leading-relaxed text-slate-900 transition-colors group-hover:text-brand-600">
                {work.title}
              </h2>
            </Link>
          ) : (
            <h2 className="break-words text-[15px] font-semibold leading-relaxed text-slate-900 transition-colors group-hover:text-brand-600">
              {work.title}
            </h2>
          )}

          {work.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
              {work.description}
            </p>
          )}

          <div className="mt-3 space-y-1.5 text-xs text-slate-500">
            {(work.students ?? []).length > 0 && (
              <div className="flex gap-2">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">นักศึกษาผู้จัดทำ: {(work.students ?? []).join(", ")}</span>
              </div>
            )}
            {work.advisor_name && (
              <div className="flex gap-2">
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">อาจารย์ที่ปรึกษา: {work.advisor_name}</span>
              </div>
            )}
          </div>

          {(work.technologies ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(work.technologies ?? []).slice(0, 4).map((item) => (
                <span key={item} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-5">
            <div className="flex flex-wrap items-center gap-2">
              {pdfUrl && pdfViewerHref ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPdfOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    ดูเล่มผลงาน
                  </button>
                  <a
                    href={pdfUrl}
                    download={work.pdf_filename ?? undefined}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ดาวน์โหลด PDF
                  </a>
                </>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                  ยังไม่มีไฟล์ PDF
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
      <FinalProjectPdfModal
        open={isPdfOpen}
        title={work.title}
        pdfUrl={pdfUrl}
        pdfFilename={work.pdf_filename}
        onClose={() => setIsPdfOpen(false)}
      />
    </>
  );
}
