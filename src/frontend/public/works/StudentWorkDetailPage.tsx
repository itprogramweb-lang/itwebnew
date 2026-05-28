import { notFound } from "next/navigation";
import Link from "next/link";
import { Download, ExternalLink, FileText, GraduationCap, Users, CalendarDays } from "lucide-react";
import { getStudentWorkBySlug } from "@/lib/supabase/queries";
import CroppedImage from "@/components/ui/CroppedImage";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { buildPdfViewerHref, resolveStudentWorkPdfUrl } from "./pdfLinks";

export default async function StudentWorkDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const work = await getStudentWorkBySlug(params.slug).catch(() => null);
  if (!work) notFound();

  const hasExternal = !!work.external_url && work.external_url !== "#";
  const isCourseWork = work.work_type === "course";
  const workTypeLabel = isCourseWork ? "ผลงานรายวิชา" : "ปริญญานิพนธ์ (Thesis)";
  const detailHref = work.slug ? `/works/students/${encodeURIComponent(work.slug)}` : null;
  const backHref =
    isCourseWork && work.course_id && work.academic_year
      ? `/works/students/course/${encodeURIComponent(work.course_id)}/${encodeURIComponent(work.academic_year)}`
      : !isCourseWork && work.academic_year
      ? `/works/students/final-projects/${encodeURIComponent(work.academic_year)}`
      : "/works/students";
  const pdfHref = buildPdfViewerHref({
    file: work.pdf_url,
    title: work.title,
    filename: work.pdf_filename,
    returnTo: detailHref ?? backHref,
    returnLabel: "กลับไปหน้ารายละเอียดผลงาน",
    source: isCourseWork ? "course" : "final_project",
  });
  const pdfUrl = resolveStudentWorkPdfUrl(work.pdf_url);
  if (!isCourseWork && !pdfUrl) notFound();
  const advisorLabel = isCourseWork ? "อาจารย์ผู้สอน" : "อาจารย์ที่ปรึกษา";
  const courseHref =
    isCourseWork && work.course_id ? `/works/students/course/${encodeURIComponent(work.course_id)}` : null;
  const courseYearHref =
    isCourseWork && work.course_id && work.academic_year
      ? `/works/students/course/${encodeURIComponent(work.course_id)}/${encodeURIComponent(work.academic_year)}`
      : null;
  const finalProjectYearHref =
    !isCourseWork && work.academic_year
      ? `/works/students/final-projects/${encodeURIComponent(work.academic_year)}`
      : null;
  const breadcrumbItems = isCourseWork
    ? [
        { label: "หน้าแรก", href: "/" },
        { label: "ผลงาน" },
        { label: "ผลงานนักศึกษา", href: "/works/students" },
        { label: "ผลงานรายวิชา", href: "/works/students/course" },
        {
          label: work.course_name ?? work.course_id ?? "รายวิชา",
          href: courseHref ?? undefined,
        },
        ...(work.academic_year
          ? [
              {
                label: `ปีการศึกษา ${work.academic_year}`,
                href: courseYearHref ?? undefined,
              },
            ]
          : []),
        { label: work.title },
      ]
    : [
        { label: "หน้าแรก", href: "/" },
        { label: "ผลงาน" },
        { label: "ผลงานนักศึกษา", href: "/works/students" },
        { label: "ปริญญานิพนธ์ (Thesis)", href: "/works/students/final-projects" },
        ...(work.academic_year
          ? [
              {
                label: `ปีการศึกษา ${work.academic_year}`,
                href: finalProjectYearHref ?? undefined,
              },
            ]
          : []),
        { label: work.title },
      ];

  return (
    <>
      <div className="sticky top-[64px] z-[70] border-b border-white/10 bg-slate-950/90 backdrop-blur-xl lg:top-[88px]">
        <div className="container-wide flex justify-center py-1.5">
          <BreadcrumbTrail dark backHref={backHref} items={breadcrumbItems} />
        </div>
      </div>

      <div className="bg-slate-950 pt-16 pb-16 sm:pt-20 sm:pb-20">
        <div className="container-wide">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {workTypeLabel}
            </span>
            <span className="rounded-full bg-brand-600/20 px-3 py-1 text-xs font-medium text-brand-300">
              {work.category || "ผลงานนักศึกษา"}
            </span>
            {work.academic_year && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="w-3.5 h-3.5" />
                {work.academic_year}
              </span>
            )}
          </div>
          <h1 className="max-w-4xl break-words text-2xl font-bold leading-relaxed text-white sm:text-3xl lg:text-4xl">
            {work.title}
          </h1>
        </div>
      </div>

      {/* Body */}
      <section className="section bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Main */}
            <div className="lg:col-span-3 space-y-6">
              <CroppedImage
                src={work.image_url}
                fallbackSrc="/placeholders/student-work-placeholder.svg"
                alt={work.image_alt || work.title}
                crop={work.image_crop_settings}
                className="aspect-video w-full rounded-2xl bg-slate-100"
              />
              {work.description && (
                <p className="text-slate-700 leading-relaxed text-[1.05rem]">
                  {work.description}
                </p>
              )}
              {hasExternal && (
                <Link
                  href={work.external_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
                >
                  ดูโปรเจกต์
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                  <FileText className="w-4 h-4 text-brand-600" />
                  ไฟล์ PDF
                </div>
                {pdfUrl && pdfHref ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={pdfHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                    >
                      เปิดดู PDF
                      <FileText className="h-4 w-4" />
                    </Link>
                    <a
                      href={pdfUrl}
                      download={work.pdf_filename ?? undefined}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      ดาวน์โหลด PDF
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">ยังไม่มีไฟล์ PDF สำหรับผลงานนี้</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="text-sm font-semibold text-slate-700 mb-3">ข้อมูลผลงาน</div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>ประเภท: {workTypeLabel}</p>
                  {work.category && <p>หมวดหมู่: {work.category}</p>}
                  {work.academic_year && <p>ปีการศึกษา: {work.academic_year}</p>}
                  {isCourseWork && work.course_id && <p>รหัสวิชา: {work.course_id}</p>}
                  {isCourseWork && work.course_name && <p>ชื่อวิชา: {work.course_name}</p>}
                </div>
              </div>
              {(work.students ?? []).length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                    <Users className="w-4 h-4 text-brand-600" />
                    นักศึกษาผู้จัดทำ
                  </div>
                  <ul className="space-y-1.5">
                    {(work.students ?? []).map((s) => (
                      <li key={s} className="text-sm text-slate-700">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {work.advisor_name && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <GraduationCap className="w-4 h-4 text-brand-600" />
                    {advisorLabel}
                  </div>
                  <p className="text-sm text-slate-700">{work.advisor_name}</p>
                </div>
              )}
              {(work.technologies ?? []).length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-semibold text-slate-700 mb-3">
                    เทคโนโลยีที่ใช้
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(work.technologies ?? []).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
