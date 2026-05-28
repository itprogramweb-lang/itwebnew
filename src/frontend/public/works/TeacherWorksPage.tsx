import Link from "next/link";
import { Download, ExternalLink, FileText, FolderSearch } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import CroppedImage from "@/components/ui/CroppedImage";
import { getTeacherWorks } from "@/lib/supabase/queries";
import { buildPdfViewerHref, resolveStudentWorkPdfUrl } from "./pdfLinks";

const workFallback = "/placeholders/teacher-work-placeholder.svg";

function getTeacherWorkPdfSource(work: Awaited<ReturnType<typeof getTeacherWorks>>[number]) {
  if (resolveStudentWorkPdfUrl(work.pdf_url)) return work.pdf_url;
  if (resolveStudentWorkPdfUrl(work.project_url)) return work.project_url;
  if (resolveStudentWorkPdfUrl(work.external_url)) return work.external_url;
  return null;
}

export default async function TeacherWorksPage() {
  const works = await getTeacherWorks();
  const sortedWorks = works
    .map((work, index) => ({
      work,
      index,
      hasPdf: getTeacherWorkPdfSource(work) !== null,
    }))
    .sort((a, b) => {
      if (a.hasPdf !== b.hasPdf) return a.hasPdf ? -1 : 1;
      return a.index - b.index;
    })
    .map((item) => item.work);

  return (
    <>
      <PageHeader
        dark
        eyebrow="ผลงานวิชาการ"
        title="ผลงานอาจารย์"
        description="งานวิจัย บทความวิชาการ รางวัล และการบริการวิชาการของคณาจารย์ในสาขา"
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ผลงาน" },
              { label: "ผลงานอาจารย์" },
            ]}
          />
        }
      />

      <section className="section">
        <div className="container-wide">
          {works.length === 0 ? (
            <div className="text-center py-16 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FolderSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูลในขณะนี้</p>
            </div>
          ) : (
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedWorks.map((work) => {
                const pdfSource = getTeacherWorkPdfSource(work);
                const pdfUrl = resolveStudentWorkPdfUrl(pdfSource);
                const pdfViewerHref = buildPdfViewerHref({
                  file: pdfSource,
                  title: work.title,
                  filename: work.pdf_filename ?? `${work.title}.pdf`,
                  returnTo: "/works/teachers",
                  returnLabel: "กลับไปผลงานอาจารย์",
                  source: "teacher",
                });
                return (
                  <article key={work.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white card-hover">
                    <CroppedImage
                      src={work.image_url}
                      fallbackSrc={workFallback}
                      alt={work.image_alt || work.title}
                      crop={work.image_crop_settings}
                      className="h-44 w-full rounded-none bg-slate-100"
                    />
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                          {work.category || "ผลงานอาจารย์"}
                        </span>
                        <span className="text-slate-500">{work.year}</span>
                      </div>
                      <h2 className="mt-3 font-semibold text-slate-900 leading-snug">{work.title}</h2>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">{work.description}</p>
                      <div className="mt-4 text-xs text-slate-500">
                        เจ้าของผลงาน: {work.teacher_name || "-"}
                      </div>
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        {pdfUrl && pdfViewerHref ? (
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Link
                              href={pdfViewerHref}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                            >
                              <FileText className="h-4 w-4" />
                              ดูเล่มผลงาน
                            </Link>
                            <a
                              href={pdfUrl}
                              download={work.pdf_filename ?? `${work.title}.pdf`}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                            >
                              <Download className="h-4 w-4" />
                              ดาวน์โหลด PDF
                            </a>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                            <ExternalLink className="h-3.5 w-3.5" />
                            ยังไม่มีไฟล์ PDF
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
