import Link from "next/link";
import { ArrowRight, FileEdit, FileSearch, FileText, GraduationCap, Mail } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";

const quickLinks = [
  { icon: <FileEdit className="w-5 h-5" />, title: "ลงทะเบียนเรียน", href: "/students/registration" },
  { icon: <FileSearch className="w-5 h-5" />, title: "ตรวจสอบผลการเรียน", href: "/students/registration" },
  { icon: <FileText className="w-5 h-5" />, title: "คำร้องออนไลน์", href: "/students/registration" },
  { icon: <GraduationCap className="w-5 h-5" />, title: "ขอเอกสารการศึกษา", href: "/students/registration" },
  { icon: <Mail className="w-5 h-5" />, title: "ติดต่อฝ่ายทะเบียน", href: "/about/contact" },
];

export default async function RegistrarPage() {
  const ps = await getPageSetting("students_registrar").catch(() => null);
  const pageTitle = ps?.title ?? "งานทะเบียน";
  const pageDescription =
    ps?.description ??
    "บริการงานทะเบียนสำหรับนักศึกษา ครอบคลุมการลงทะเบียน คำร้อง และเอกสารทางการศึกษา";
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "งานทะเบียน"}
        title={pageTitle}
        description={pageDescription}
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

      <section className="section">
        <div className="container-wide">
          <SectionTitle
            eyebrow="บริการนักศึกษา"
            title="ลิงก์ด่วนงานทะเบียน"
            description="คลิกเพื่อดูรายละเอียดหรือเข้าสู่ระบบที่เกี่ยวข้อง"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 card-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center text-white shadow-brand shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="font-medium text-slate-900">{item.title}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-brand-500 group-hover:translate-x-1 transition" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-wide">
          <div className="rounded-3xl bg-brand-gradient text-white p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />
            <div className="relative flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">ข้อมูลงานทะเบียนทั้งหมด</h2>
                <p className="text-white/85 mt-1 text-sm">
                  ดูรายละเอียดครบถ้วน รวมปฏิทินการศึกษาและ FAQ
                </p>
              </div>
              <Link
                href="/students/registration"
                className="inline-flex items-center gap-2 h-11 px-5 bg-white text-brand-600 rounded-2xl font-medium text-sm hover:opacity-95 shrink-0"
              >
                ไปที่หน้าทะเบียน
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
