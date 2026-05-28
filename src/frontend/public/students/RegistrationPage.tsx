import Link from "next/link";
import {
  Calendar,
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

const services = [
  {
    icon: <FileEdit className="w-6 h-6" />,
    title: "ลงทะเบียนเรียน",
    desc: "ลงทะเบียนรายวิชาประจำภาคการศึกษา ในช่วงเวลาที่กำหนด",
    link: "#",
    cta: "เข้าระบบทะเบียน",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "เพิ่ม / ถอนรายวิชา",
    desc: "เพิ่มถอนรายวิชาภายใน 2 สัปดาห์แรกของภาคการศึกษา",
    link: "#",
    cta: "ไปที่ระบบ",
  },
  {
    icon: <FileSearch className="w-6 h-6" />,
    title: "ตรวจสอบผลการเรียน",
    desc: "ตรวจสอบเกรดและผลการเรียนประจำภาค ผ่านระบบทะเบียนออนไลน์",
    link: "#",
    cta: "ดูผลการเรียน",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "คำร้องออนไลน์",
    desc: "ยื่นคำร้องต่าง ๆ เช่น ขอเอกสาร, ลาเรียน, ลาพักการศึกษา",
    link: "#",
    cta: "ยื่นคำร้อง",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "ขอเอกสารการศึกษา",
    desc: "ขอ transcript, ใบรับรองนักศึกษา, ใบรับรองจบ",
    link: "#",
    cta: "ขอเอกสาร",
  },
  {
    icon: <Mail className="w-6 h-6" />,
    title: "ติดต่อฝ่ายทะเบียน",
    desc: "สอบถามปัญหาเรื่องทะเบียนกับเจ้าหน้าที่สาขา",
    link: "/about/contact",
    cta: "ติดต่อ",
  },
];

const calendar = [
  { date: "1-15 พ.ค. 2568", event: "เปิดให้ลงทะเบียนเรียน ภาคต้น" },
  { date: "20 มิ.ย. 2568", event: "เปิดภาคการศึกษาที่ 1" },
  { date: "20 มิ.ย. - 4 ก.ค. 2568", event: "ช่วงเพิ่ม-ถอนรายวิชา" },
  { date: "10-15 ก.ย. 2568", event: "สอบกลางภาค" },
  { date: "20-30 ต.ค. 2568", event: "สอบปลายภาค" },
  { date: "10 พ.ย. 2568", event: "ประกาศผลสอบ" },
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
                className="group rounded-3xl border border-slate-200 bg-white p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-brand mb-4 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {s.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="ปฏิทินการศึกษา"
            title="วันสำคัญ ปีการศึกษา 2568"
            description="กำหนดการอ้างอิงเบื้องต้น โปรดตรวจสอบประกาศจากสำนักส่งเสริมวิชาการอีกครั้ง"
          />
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
            <ul className="divide-y divide-slate-100">
              {calendar.map((c) => (
                <li
                  key={c.event}
                  className="flex flex-col gap-3 px-5 py-4 hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 grid place-items-center text-brand-600 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-slate-900 sm:truncate">
                      {c.event}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                    {c.date}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-wide max-w-4xl">
          <SectionTitle eyebrow="คำถามที่พบบ่อย" title="FAQ งานทะเบียน" align="center" />
          <div className="space-y-3">
            {registrationFaqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 open:shadow-sm"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-brand-500 shrink-0" />
                    <span className="font-medium text-slate-900">{f.q}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 ml-8 text-sm text-slate-600 leading-relaxed">
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
