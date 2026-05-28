import Link from "next/link";
import { ArrowRight, Download, FileText, GraduationCap, Users } from "lucide-react";
import CroppedImage from "@/components/ui/CroppedImage";
import type { StudentWorkRow } from "@/lib/supabase/queries";
import { buildPdfViewerHref, resolveStudentWorkPdfUrl } from "./pdfLinks";

const workFallback = "/placeholders/student-work-placeholder.svg";

export default function StudentWorkCard({ work }: { work: StudentWorkRow }) {
  const detailHref = work.slug ? `/works/students/${work.slug}` : null;
  const isCourseWork = work.work_type === "course";
  const isFinalProject = work.work_type === "final_project" || work.work_type === null;
  const pdfReturnTo =
    isCourseWork && work.course_id && work.academic_year
      ? `/works/students/course/${encodeURIComponent(work.course_id)}/${encodeURIComponent(work.academic_year)}`
      : isCourseWork
      ? "/works/students/course"
      : isFinalProject && work.academic_year
      ? `/works/students/final-projects/${encodeURIComponent(work.academic_year)}`
      : isFinalProject
      ? "/works/students/final-projects"
      : "/works/students";
  const pdfSource = isCourseWork ? "course" : isFinalProject ? "final_project" : "student";
  const pdfReturnLabel = isCourseWork
    ? "กลับไปผลงานรายวิชา"
    : isFinalProject
    ? "กลับไปปริญญานิพนธ์ (Thesis)"
    : "กลับไปผลงานนักศึกษา";
  const pdfHref = buildPdfViewerHref({
    file: work.pdf_url,
    title: work.title,
    filename: work.pdf_filename,
    returnTo: pdfReturnTo,
    returnLabel: pdfReturnLabel,
    source: pdfSource,
  });
  const pdfUrl = resolveStudentWorkPdfUrl(work.pdf_url);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white card-hover h-full flex flex-col">
      <CroppedImage
        src={work.image_url}
        fallbackSrc={workFallback}
        alt={work.image_alt || work.title}
        crop={work.image_crop_settings}
        className="h-44 w-full rounded-none bg-slate-100 group-hover:scale-105 transition-transform duration-300"
      />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
            {work.category || "ผลงานนักศึกษา"}
          </span>
          {work.academic_year && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              ปีการศึกษา {work.academic_year}
            </span>
          )}
        </div>

        <h2 className="mt-3 font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
          {work.title}
        </h2>

        {work.description && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
            {work.description}
          </p>
        )}

        {work.course_id && (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div>รหัสวิชา: {work.course_id}</div>
            {work.course_name && <div>ชื่อวิชา: {work.course_name}</div>}
          </div>
        )}

        <div className="mt-4 space-y-1.5 text-xs text-slate-500">
          {(work.students ?? []).length > 0 && (
            <div className="flex gap-2">
              <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-1">นักศึกษาผู้จัดทำ: {(work.students ?? []).join(", ")}</span>
            </div>
          )}
          {work.advisor_name && (
            <div className="flex gap-2">
              <GraduationCap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>อาจารย์ที่ปรึกษา: {work.advisor_name}</span>
            </div>
          )}
        </div>

        {(work.technologies ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(work.technologies ?? []).slice(0, 5).map((item) => (
              <span key={item} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap gap-2">
            {detailHref && (
              <Link
                href={detailHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                ดูรายละเอียด
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
            {pdfUrl && pdfHref ? (
              <>
                <Link
                  href={pdfHref}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  เปิดดู PDF
                </Link>
                <a
                  href={pdfUrl}
                  download={work.pdf_filename ?? undefined}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  ดาวน์โหลด PDF
                </a>
              </>
            ) : (
              <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                ยังไม่มีไฟล์ PDF
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
