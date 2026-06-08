import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Download,
  FolderSearch,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/primitives";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPrograms, getPageSetting } from "@/lib/supabase/queries";
import { normalizeProgramEnglishNames } from "@/lib/programDegreeNames";
// 🛠️ ดึง PageHero ชิ้นงานส่วนกลางเข้ามาจัดการแบนเนอร์ แสงสีส้ม และ Breadcrumb แทน PageHeader ตัวเก่า
import PageHero from "@/components/ui/PageHero";

const programFallback = "/placeholders/program-placeholder.svg";

type DetailObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is DetailObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function valueToHtml(value: unknown, depth = 0): string {
  if (!hasValue(value)) return "";

  if (typeof value === "string") {
    if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;

    return value
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br>")}</p>`)
      .join("");
  }

  if (Array.isArray(value)) {
    return `<ul>${value
      .map((item) => `<li>${escapeHtml(String(item))}</li>`)
      .join("")}</ul>`;
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .filter(([, subValue]) => hasValue(subValue))
      .map(([key, subValue]) => {
        const tag = depth === 0 ? "h2" : "h3";
        return `<${tag}>${escapeHtml(key)}</${tag}>${valueToHtml(
          subValue,
          depth + 1
        )}`;
      })
      .join("");
  }

  return `<p>${escapeHtml(String(value))}</p>`;
}

function getProgramDetailsHtml(details: DetailObject | null | undefined) {
  if (!details) return "";

  if (typeof details.content === "string") {
    return details.content;
  }

  if (Array.isArray(details.sections)) {
    return details.sections
      .filter((item): item is DetailObject => isPlainObject(item))
      .map((item) => {
        const title = typeof item.title === "string" ? item.title : "";
        const content = item.content ?? "";

        return `${
          title ? `<h2>${escapeHtml(title)}</h2>` : ""
        }${valueToHtml(content)}`;
      })
      .join("");
  }

  return Object.entries(details)
    .filter(([key, value]) => key !== "version" && hasValue(value))
    .map(([key, value]) => `<h2>${escapeHtml(key)}</h2>${valueToHtml(value)}`)
    .join("");
}

function renderHtmlContent(html: string) {
  return (
    <div
      className="news-body max-w-none text-[15px] leading-8 text-slate-700
      [&_h1]:mb-5 [&_h1]:mt-10 [&_h1]:border-b [&_h1]:border-orange-100 [&_h1]:pb-3 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-950
      [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-950
      [&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-orange-700
      [&_p]:mb-5 [&_p]:leading-8
      [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:rounded-2xl [&_ul]:bg-slate-50 [&_ul]:px-8 [&_ul]:py-5
      [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:rounded-2xl [&_ol]:bg-slate-50 [&_ol]:px-8 [&_ol]:py-5
      [&_li]:leading-8
      [&_blockquote]:my-6 [&_blockquote]:rounded-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-orange-400 [&_blockquote]:bg-orange-50 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-orange-900
      [&_a]:font-medium [&_a]:text-orange-600 [&_a]:underline
      [&_hr]:my-8 [&_hr]:border-slate-200
      [&_img]:my-6 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200
      [&_figure]:my-6
      [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-500
      [&_.news-crop-frame]:my-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function BachelorProgramPage() {
  const [programs, ps] = await Promise.all([
    getPrograms(),
    getPageSetting("programs_bachelor").catch(() => null),
  ]);

  const program = programs.find((item) => item.level === "bachelor");

  const fallbackTitle = ps?.title ?? "หลักสูตรปริญญาตรี";
  const fallbackDesc =
    ps?.description ??
    "หลักสูตรที่เน้นทักษะปฏิบัติจริง ครอบคลุม Software, Data, Network และ AI";
  const eyebrow = ps?.subtitle ?? "ปริญญาตรี";

  // ============================================================
  // 🚫 กรณีที่ 1: ดักฟอลแบ็กหากยังไม่มีรูปหรือข้อมูลรายวิชาในฐานข้อมูล
  // ============================================================
  if (!program) {
    return (
      <>
        <PageHero
          template="no-image-clean"
          imageUrl={null}
          title={fallbackTitle}
          eyebrow={eyebrow}
          description={fallbackDesc}
        />

        <section className="section">
          <div className="container-wide">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <FolderSearch className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูลในขณะนี้</p>
            </div>
          </div>
        </section>
      </>
    );
  }

  const rawDetailsHtml = normalizeProgramEnglishNames(
    getProgramDetailsHtml(program.details ?? {})
  );
  const pageTitle = normalizeProgramEnglishNames(ps?.title ?? program.title);
  const pageDescription =
    normalizeProgramEnglishNames(ps?.description ?? program.description) ??
    undefined;

  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;
  const rawHeroTemplate = ps?.hero_layout ?? null;

  const heroTemplate =
    rawHeroTemplate && rawHeroTemplate !== "default"
      ? rawHeroTemplate
      : heroImageUrl
        ? "background-overlay"
        : "no-image-clean";

  // ============================================================
  // ✨ กรณีที่ 2: แสดงผลข้อมูลหลักสูตรฉบับเต็มพรีเมียมครบถ้วน
  // ============================================================
  return (
    <>
      {/* 🚀 สวมแบนเนอร์ PageHero ชิดซ้ายสว่างนวลตา พร้อมยัดปุ่มติดต่อและดาวน์โหลดเข้าไปที่ส่วน children */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={pageTitle}
        eyebrow={eyebrow}
        description={pageDescription ?? ""}
      >
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/about/contact"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-950/25 transition-colors hover:bg-orange-400 sm:h-12 sm:text-base"
          >
            ติดต่อสอบถาม <ArrowRight className="h-4 w-4" />
          </Link>

          {program.curriculum_url && program.curriculum_url !== "#" && (
            <Link
              href={program.curriculum_url}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-12 sm:text-base"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลดหลักสูตร
            </Link>
          )}
        </div>
      </PageHero>

      {rawDetailsHtml.trim() ? (
        <section className="bg-slate-50 py-14">
          <div className="container-wide">
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 overflow-hidden rounded-[2.5rem] border border-slate-100 bg-gradient-to-br from-white to-orange-50/20 p-6 shadow-sm sm:p-10">
                <div className="mx-auto max-w-4xl space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                      ข้อมูลหลักสูตร
                    </h1>

                    <p className="mx-auto max-w-3xl text-left text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 lg:text-lg">
                      รายละเอียดหลักสูตรระดับปริญญาตรี โครงสร้างรายวิชา
                      แผนการศึกษา คุณสมบัติผู้สมัคร และข้อมูลสำคัญทั้งหมด
                      สำหรับการศึกษาต่อในระดับปริญญาตรี
                    </p>
                  </div>

                  {program.image_url ? (
                    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-slate-100 shadow-md shadow-slate-200/50 transition-all duration-300 hover:shadow-lg">
                      <CroppedImage
                        src={program.image_url}
                        fallbackSrc={programFallback}
                        alt={program.image_alt || program.title}
                        crop={program.image_crop_settings}
                        className="aspect-[16/9] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="grid aspect-[16/9] w-full place-items-center rounded-[2rem] border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                      <span className="text-sm text-slate-400">
                        Bachelor Program Image
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <article className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-white shadow-xl shadow-slate-100/40">
                <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-6 sm:px-10">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1 rounded-full bg-orange-500" />
                    <h2 className="text-lg font-bold text-slate-800">
                      รายละเอียดหลักสูตรฉบับเต็ม
                    </h2>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
                  {renderHtmlContent(rawDetailsHtml)}
                </div>
              </article>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-slate-50 py-20">
          <div className="container-wide">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <AlertCircle className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                ไม่พบข้อมูลหลักสูตรฉบับเต็ม
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                ขณะนี้ยังไม่มีข้อมูลรายละเอียดหลักสูตรในระบบ
                หากคุณต้องการสอบถามข้อมูลเพิ่มเติมหรือรับเอกสารฉบับเต็ม
                กรุณาติดต่อทางสาขาวิชาโดยตรง
              </p>

              <Link
                href="/about/contact"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                ติดต่อสาขา <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}