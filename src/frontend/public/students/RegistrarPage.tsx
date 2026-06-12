import Link from "next/link";
import {
  ArrowRight,
  FileEdit,
  FileSearch,
  FileText,
  GraduationCap,
  Mail,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/primitives";
import { getPageSetting } from "@/lib/supabase/queries";
// 🛠️ ดึง PageHero เข้ามาใช้งานแทน PageHeader เดิม
import PageHero from "@/components/ui/PageHero";

const REGISTRATION_URL = "https://oreg.rmutt.ac.th/?page_id=14908";
const REQUEST_URL = "https://oreg.rmutt.ac.th/?page_id=2863";
const DOCUMENT_URL = "https://oreg.rmutt.ac.th/SSC/?p=85";
const OREG_URL = "https://oreg.rmutt.ac.th/?page_id=14908";

const quickLinks = [
  {
    icon: <FileEdit className="w-5 h-5" />,
    title: "ลงทะเบียนเรียน",
    href: REGISTRATION_URL,
    external: true,
  },
  {
    icon: <FileSearch className="w-5 h-5" />,
    title: "ตรวจสอบผลการเรียน",
    href: OREG_URL,
    external: true,
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "คำร้องออนไลน์",
    href: REQUEST_URL,
    external: true,
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "ขอเอกสารการศึกษา",
    href: DOCUMENT_URL,
    external: true,
  },
  {
    icon: <Mail className="w-5 h-5" />,
    title: "ติดต่อฝ่ายทะเบียน",
    href: "/about/contact",
    external: false,
  },
];

export default async function RegistrarPage() {
  const ps = await getPageSetting("students_registrar").catch(() => null);

  const pageTitle = ps?.title ?? "งานทะเบียน";
  const pageDescription =
    ps?.description ??
    "บริการงานทะเบียนสำหรับนักศึกษา ครอบคลุมการลงทะเบียน คำร้อง และเอกสารทางการศึกษา";

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
      {/* 🚀 สวมแบนเนอร์พรีเมียมตัวเดียวกับหน้าอื่น ๆ ครอบคลุมรูปภาพพื้นหลังให้ซ้อนเป็นเลเยอร์อย่างถูกต้อง */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={pageTitle}
        eyebrow={ps?.subtitle ?? "งานทะเบียน"}
        description={pageDescription}
      />

      <section className="section">
        <div className="container-wide">
          <SectionTitle
            eyebrow="บริการนักศึกษา"
            title="ลิงก์ด่วนงานทะเบียน"
            description="คลิกเพื่อดูรายละเอียดหรือเข้าสู่ระบบที่เกี่ยวข้อง"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 card-hover"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-brand transition-transform group-hover:scale-110">
                  {item.icon}
                </div>

                <span className="font-medium text-slate-900">
                  {item.title}
                </span>

                <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />

            <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  เข้าสู่ระบบทะเบียนนักศึกษา
                </h2>

                <p className="mt-1 text-sm text-white/85">
                  สำหรับลงทะเบียนเรียน ตรวจสอบผลการเรียน คำร้อง และเอกสารทางการศึกษา
                </p>
              </div>

              <Link
                href={OREG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white px-5 text-sm font-medium text-brand-600 hover:opacity-95"
              >
                ไปที่เว็บทะเบียน
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}