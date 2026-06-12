import Link from "next/link";
import { Download, ExternalLink, FileText, FolderSearch } from "lucide-react";
import CroppedImage from "@/components/ui/CroppedImage";
import { getTeacherWorks, getPageSetting } from "@/lib/supabase/queries";
import { buildPdfViewerHref, resolveStudentWorkPdfUrl } from "./pdfLinks";
// 🛠️ เปลี่ยนมาดึง PageHero ชิ้นงานกลางเข้ามาคุมระบบแบนเนอร์ แสงสีส้ม และ Breadcrumb แทน PageHeader ตัวเก่า
import PageHero from "@/components/ui/PageHero";

const workFallback = "/placeholders/teacher-work-placeholder.svg";

function getTeacherWorkPdfSource(work: Awaited<ReturnType<typeof getTeacherWorks>>[number]) {
  if (resolveStudentWorkPdfUrl(work.pdf_url)) return work.pdf_url;
  if (resolveStudentWorkPdfUrl(work.project_url)) return work.project_url;
  if (resolveStudentWorkPdfUrl(work.external_url)) return work.external_url;
  return null;
}

function getWorkTime(work: Awaited<ReturnType<typeof getTeacherWorks>>[number]) {
  const row = work as {
    created_at?: string | null;
    updated_at?: string | null;
    published_at?: string | null;
    id?: string | number | null;
  };

  const dateValue = row.created_at ?? row.published_at ?? row.updated_at;

  if (dateValue) {
    const time = new Date(dateValue).getTime();
    if (Number.isFinite(time)) return time;
  }

  const numericId = Number(row.id);
  if (Number.isFinite(numericId)) return numericId;

  return 0;
}

function isFeaturedWork(work: Awaited<ReturnType<typeof getTeacherWorks>>[number]) {
  const row = work as {
    is_featured?: boolean | null;
    featured?: boolean | null;
  };

  return Boolean(row.is_featured ?? row.featured);
}

export default async function TeacherWorksPage() {
  // 🛠️ ดึงข้อมูลผลงานอาจารย์พร้อมดึงข้อมูลการตั้งค่าแบนเนอร์หลังบ้านผ่านคีย์ "works_teachers"
  const [works, ps] = await Promise.all([
    getTeacherWorks(),
    getPageSetting("works_teachers").catch(() => null),
  ]);

  const fallbackTitle = ps?.title ?? "ผลงานอาจารย์";
  const fallbackDesc =
    ps?.description ??
    "งานวิจัย บทความวิชาการ รางวัล และการบริการวิชาการของคณาจารย์ในสาขา";
  const eyebrow = ps?.subtitle ?? "ผลงานวิชาการ";

  const sortedWorks = works
    .map((work, index) => ({
      work,
      index,
      isFeatured: isFeaturedWork(work),
      time: getWorkTime(work),
    }))
    .sort((a, b) => {
      // 1) ผลงานเด่นขึ้นก่อน
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      // 2) ในกลุ่มเดียวกัน ให้รายการใหม่กว่า / เพิ่มทีหลัง ขึ้นก่อน
      if (a.time !== b.time) {
        return b.time - a.time;
      }

      // 3) กันกรณีไม่มีวันที่ ให้ตัวที่มาทีหลังใน array ขึ้นก่อน
      return b.index - a.index;
    })
    .map((item) => item.work);

  // ตรวจจับเทมเพลต Layout แบนเนอร์ให้แสดงตามระบบหลังบ้านที่เลือกไว้ใน Dashboard
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;
  const rawHeroTemplate = ps?.hero_layout ?? null;

  const heroTemplate =
    rawHeroTemplate && rawHeroTemplate !== "default"
      ? rawHeroTemplate
      : heroImageUrl
        ? "background-overlay"
        : "no-image-clean";

  return (
    <>
      {/* 🚀 เรียกใช้ PageHero ส่วนกลางเพื่อวาดโครงสร้างบานเนอร์สาดแสงส้ม และเจนระบบ Breadcrumb ให้อัตโนมัติ */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={fallbackTitle}
        eyebrow={eyebrow}
        description={fallbackDesc}
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
                const detailHref = `/works/teachers/${encodeURIComponent(work.id)}`;
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
                  <article
                    key={work.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100/70 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
                  >
                    <Link href={detailHref} className="block overflow-hidden">
                      <CroppedImage
                        src={work.image_url}
                        fallbackSrc={workFallback}
                        alt={work.image_alt || work.title}
                        crop={work.image_crop_settings}
                        className="h-44 w-full rounded-none bg-slate-100 transition duration-300 group-hover:scale-105"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                          {work.category || "ผลงานอาจารย์"}
                        </span>
                        <span className="text-slate-500">{work.year}</span>
                      </div>

                      <Link href={detailHref} className="mt-3 block">
                        <h2 className="break-words text-[15px] font-semibold leading-relaxed text-slate-900 transition-colors group-hover:text-brand-600">
                          {work.title}
                        </h2>
                      </Link>

                      {work.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                          {work.description}
                        </p>
                      )}

                      <div className="mt-4 text-xs text-slate-500">
                        เจ้าของผลงาน: {work.teacher_name || "-"}
                      </div>

                      <div className="mt-auto border-t border-slate-100 pt-4">
                        <Link
                          href={detailHref}
                          className="mb-2 inline-flex items-center justify-center rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                        >
                          ดูรายละเอียด
                        </Link>
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
