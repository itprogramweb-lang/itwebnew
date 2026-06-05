import Link from "next/link";
import {
  FileEdit,
  FileSearch,
  FileText,
  GraduationCap,
  Mail,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { registrationFaqs } from "@/data/faqs";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";


const REGISTRATION_URL = "https://oreg.rmutt.ac.th/Apply/";
const REQUEST_URL = "https://oreg.rmutt.ac.th/?page_id=2863";
const DOCUMENT_URL = "https://oreg.rmutt.ac.th/SSC/?p=85";
const OREG_URL = "https://oreg.rmutt.ac.th/?page_id=14908";

const services = [
  {
    icon: <FileEdit className="w-6 h-6" />,
    title: "ลงทะเบียนเรียน",
    desc: "ลงทะเบียนรายวิชาประจำภาคการศึกษา ในช่วงเวลาที่กำหนด",
    link: REGISTRATION_URL,
    cta: "เข้าระบบลงทะเบียน",
    external: true,
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "เพิ่ม / ถอนรายวิชา",
    desc: "เพิ่มถอนรายวิชาภายใน 2 สัปดาห์แรกของภาคการศึกษา",
    link: OREG_URL,
    cta: "ไปที่ระบบ",
    external: true,
  },
  {
    icon: <FileSearch className="w-6 h-6" />,
    title: "ตรวจสอบผลการเรียน",
    desc: "ตรวจสอบเกรดและผลการเรียนประจำภาค ผ่านระบบทะเบียนออนไลน์",
    link: OREG_URL,
    cta: "ดูผลการเรียน",
    external: true,
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "คำร้องออนไลน์",
    desc: "ยื่นคำร้องต่าง ๆ เช่น ขอเอกสาร, ลาเรียน, ลาพักการศึกษา",
    link: REQUEST_URL,
    cta: "ยื่นคำร้อง",
    external: true,
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "ขอเอกสารการศึกษา",
    desc: "ขอ transcript, ใบรับรองนักศึกษา, ใบรับรองจบ",
    link: DOCUMENT_URL,
    cta: "ขอเอกสาร",
    external: true,
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: "ติดต่อฝ่ายทะเบียน",
    desc: "สอบถามปัญหาเรื่องทะเบียนกับเจ้าหน้าที่สาขา",
    link: "/about/contact",
    cta: "ติดต่อ",
    external: false,
  },
];

export default async function RegistrationPage() {
  const ps = await getPageSetting("students_registration").catch(() => null);

  const pageTitle = ps?.title ?? "ทะเบียนนักศึกษา";
  const pageDescription =
    ps?.description ??
    "รวมลิงก์และข้อมูลสำคัญสำหรับนักศึกษา ครอบคลุมเรื่องลงทะเบียน เพิ่มถอน ผลการเรียน และคำร้องต่าง ๆ";

  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "งานทะเบียน"}
        title={pageTitle}
        description={pageDescription}
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "นักศึกษาปัจจุบัน" },
              { label: "ทะเบียน" },
            ]}
          />
        }
      />

      {heroImageUrl && ps?.hero_layout !== "no-image" && (
        <div className="container-wide pt-8">
          <CroppedImage
            src={heroImageUrl}
            alt={ps?.hero_image_alt ?? pageTitle}
            crop={heroImageCrop}
            className="aspect-video w-full rounded-3xl border border-slate-100 bg-slate-100"
          />
        </div>
      )}

      {/* Services grid */}
      <section className="section">
        <div className="container-wide">
          <SectionTitle eyebrow="บริการนักศึกษา" title="เรื่องที่ทำได้บ่อย" />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {services.map((s) => (
              <Link
                key={s.title}
                href={s.link}
                target={s.external ? "_blank" : undefined}
                rel={s.external ? "noopener noreferrer" : undefined}
                className="group rounded-3xl border border-slate-200 bg-white p-6 card-hover"
              >
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand transition-transform group-hover:scale-110">
                  {s.icon}
                </div>

                <h3 className="mb-1.5 font-semibold text-slate-900">
                  {s.title}
                </h3>

                <p className="text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-wide max-w-4xl">
          <SectionTitle
            eyebrow="คำถามที่พบบ่อย"
            title="FAQ งานทะเบียน"
            align="center"
          />

          <div className="space-y-3">
            {registrationFaqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 shrink-0 text-brand-500" />
                    <span className="font-medium text-slate-900">{f.q}</span>
                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>

                <p className="ml-8 mt-3 text-sm leading-relaxed text-slate-600">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}