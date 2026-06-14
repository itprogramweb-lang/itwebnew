import Link from "next/link";
import { ArrowRight, Award, BookOpen, GraduationCap } from "lucide-react";
import { getPageSetting } from "@/lib/supabase/queries";
// 🛠️ เปลี่ยนมาดึง PageHero ชิ้นงานกลางเข้ามาคุมระบบแบนเนอร์ แสงสีส้ม และ Breadcrumb แทน PageHeader ตัวเก่า
import PageHero from "@/components/ui/PageHero";

const items = [
  {
    title: "ผลงานรายวิชา",
    description: "เลือกดูผลงานตามรหัสวิชาและปีการศึกษา",
    href: "/works/students/course",
    icon: BookOpen,
  },
  {
    title: "ปริญญานิพนธ์ (Thesis)",
    description: "เลือกดูปริญญานิพนธ์ (Thesis) ตามปีการศึกษา",
    href: "/works/students/final-projects",
    icon: GraduationCap,
  },
  {
    title: "ประกวด / แข่งขัน / นำเสนอผลงาน",
    description: "ดูรายละเอียดผลงานจากเวทีประกวด การแข่งขัน และการนำเสนอผลงาน",
    href: "/works/students/competition",
    icon: Award,
  },
];

export default async function StudentWorksLandingPage() {
  // 🛠️ ดึงข้อมูลการตั้งค่าแบนเนอร์จากหลังบ้านผ่านหน้าคีย์ที่เชื่อมโยงคือ "works_students"
  const ps = await getPageSetting("works_students").catch(() => null);

  const pageTitle = ps?.title ?? "ผลงานนักศึกษา";
  const pageDescription =
    ps?.description ??
    "เลือกดูผลงานรายวิชา ปริญญานิพนธ์ (Thesis) และผลงานประกวด แข่งขัน หรือนำเสนอผลงานของนักศึกษา";
  const eyebrow = ps?.subtitle ?? "ผลงานนักศึกษา";

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
        title={pageTitle}
        eyebrow={eyebrow}
        description={pageDescription}
      />

      <section className="section">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <article className="h-full rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 card-hover">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                      เข้าดูรายการ
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
