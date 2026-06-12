import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Download, ExternalLink, FileText, GraduationCap } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import CroppedImage from "@/components/ui/CroppedImage";
import NewsContentRenderer from "@/components/news/NewsContentRenderer";
import { getTeacherWorkById } from "@/lib/supabase/queries";
import { buildPdfViewerHref, resolveStudentWorkPdfUrl } from "./pdfLinks";

const workFallback = "/placeholders/teacher-work-placeholder.svg";

function hasRenderableHtml(html: string | null | undefined) {
  if (!html) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length > 0 || /<(img|table|iframe|video|ul|ol)\b/i.test(html);
}

function getTeacherWorkPdfSource(work: NonNullable<Awaited<ReturnType<typeof getTeacherWorkById>>>) {
  if (resolveStudentWorkPdfUrl(work.pdf_url)) return work.pdf_url;
  if (resolveStudentWorkPdfUrl(work.project_url)) return work.project_url;
  if (resolveStudentWorkPdfUrl(work.external_url)) return work.external_url;
  return null;
}

export default async function TeacherWorkDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const work = await getTeacherWorkById(params.id).catch(() => null);
  if (!work) notFound();

  const detailHref = `/works/teachers/${encodeURIComponent(work.id)}`;
  const backHref = "/works/teachers";
  const pdfSource = getTeacherWorkPdfSource(work);
  const pdfUrl = resolveStudentWorkPdfUrl(pdfSource);
  const hasRichContent = hasRenderableHtml(work.content_html);
  const pdfHref = buildPdfViewerHref({
    file: pdfSource,
    title: work.title,
    filename: work.pdf_filename ?? `${work.title}.pdf`,
    returnTo: detailHref,
    returnLabel: "กลับไปหน้ารายละเอียดผลงานอาจารย์",
    source: "teacher",
  });
  const hasExternal = !!work.external_url && work.external_url !== "#" && work.external_url !== pdfSource;
  const breadcrumbItems = [
    { label: "หน้าแรก", href: "/" },
    { label: "ผลงาน" },
    { label: "ผลงานอาจารย์", href: backHref },
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
              ผลงานอาจารย์
            </span>
            <span className="rounded-full bg-brand-600/20 px-3 py-1 text-xs font-medium text-brand-300">
              {work.category || "ผลงานวิชาการ"}
            </span>
            {work.year && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {work.year}
              </span>
            )}
          </div>
          <h1 className="max-w-4xl break-words text-2xl font-bold leading-relaxed text-white sm:text-3xl lg:text-4xl">
            {work.title}
          </h1>
        </div>
      </div>

      <section className="section bg-white">
        <div className="container-wide">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <CroppedImage
                src={work.image_url}
                fallbackSrc={workFallback}
                alt={work.image_alt || work.title}
                crop={work.image_crop_settings}
                className="aspect-video w-full rounded-2xl bg-slate-100"
              />

              {hasRichContent ? (
                <NewsContentRenderer
                  html={work.content_html}
                  emptyText="ยังไม่มีเนื้อหาผลงานนี้"
                />
              ) : (
                work.description && (
                  <p className="text-[1.05rem] leading-relaxed text-slate-700">
                    {work.description}
                  </p>
                )
              )}

              {hasExternal && (
                <Link
                  href={work.external_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  เปิดลิงก์ภายนอก
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}

              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4 text-brand-600" />
                  ไฟล์ PDF
                </div>
                {pdfUrl && pdfHref ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={pdfHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      เปิดดู PDF
                      <FileText className="h-4 w-4" />
                    </Link>
                    <a
                      href={pdfUrl}
                      download={work.pdf_filename ?? undefined}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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

            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-3 text-sm font-semibold text-slate-700">ข้อมูลผลงาน</div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>ประเภท: ผลงานอาจารย์</p>
                  {work.category && <p>หมวดหมู่: {work.category}</p>}
                  {work.year && <p>ปี: {work.year}</p>}
                  {work.source_system && <p>ระบบที่มา: {work.source_system}</p>}
                </div>
              </div>

              {work.teacher_name && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <GraduationCap className="h-4 w-4 text-brand-600" />
                    เจ้าของผลงาน
                  </div>
                  <p className="text-sm text-slate-700">{work.teacher_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
