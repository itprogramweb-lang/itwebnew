import Link from "next/link";
import {
  Award,
  FlaskConical,
  HeartHandshake,
  Trophy,
  LifeBuoy,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";

const items = [
  {
    icon: <Award className="w-6 h-6" />,
    title: "ทุนการศึกษา",
    desc: "ทุนเรียนดี ทุนช่วยเหลือ ทุนจากภาคเอกชน และทุนสนับสนุนนักศึกษาทำกิจกรรม",
    bullets: [
      "ทุนเรียนดี ยกเว้นค่าเทอม",
      "ทุนช่วยเหลือนักศึกษาขาดแคลน",
      "ทุนสนับสนุนงานวิจัย/แข่งขัน",
      "ทุนจากบริษัทพันธมิตร",
    ],
  },
  {
    icon: <FlaskConical className="w-6 h-6" />,
    title: "ห้องปฏิบัติการ",
    desc: "ห้องแล็บครบวงจร เปิดให้นักศึกษาใช้งานนอกเวลาเรียน รวมกว่า 8 ห้อง",
    bullets: [
      "Software Lab",
      "Network Lab",
      "AI / Data Lab",
      "IoT & Embedded Lab",
      "Cybersecurity Lab",
    ],
  },
  {
    icon: <HeartHandshake className="w-6 h-6" />,
    title: "บริการให้คำปรึกษา",
    desc: "ทีมอาจารย์ที่ปรึกษาและนักจิตวิทยา พร้อมรับฟังและให้คำแนะนำตลอดหลักสูตร",
    bullets: [
      "อาจารย์ที่ปรึกษาประจำชั้นปี",
      "Counselor ฝ่ายแนะแนว",
      "ระบบนัดหมายออนไลน์",
      "การให้คำปรึกษาด้านอาชีพ",
    ],
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "กิจกรรมนักศึกษา",
    desc: "ชมรม ค่าย และเวทีประกวด ที่ผลักดันทักษะนอกห้องเรียน",
    bullets: [
      "ชมรมพัฒนาเว็บ",
      "ชมรม AI/Data",
      "Hackathon ภายในและภายนอก",
      "ค่ายส่งเสริมทักษะดิจิทัล",
    ],
  },
  {
    icon: <LifeBuoy className="w-6 h-6" />,
    title: "ช่องทางขอความช่วยเหลือ",
    desc: "หากพบปัญหาด้านการเรียน สุขภาพ หรือชีวิตในมหาวิทยาลัย เรามีช่องทางให้",
    bullets: [
      "ฝ่ายแนะแนว/นักจิตวิทยา",
      "ช่องทางร้องเรียนออนไลน์",
      "งานพยาบาลของมหาวิทยาลัย",
      "ฝ่ายกิจการนักศึกษา",
    ],
  },
  {
    icon: <Wifi className="w-6 h-6" />,
    title: "สิ่งอำนวยความสะดวก",
    desc: "อินเทอร์เน็ตทั่วถึง พื้นที่ทำงานนอกห้องเรียน และทรัพยากรการเรียนรู้ครบครัน",
    bullets: [
      "Wi-Fi ทั่วบริเวณคณะ",
      "Co-working space",
      "ห้องสมุดและฐานข้อมูลออนไลน์",
      "Software/Cloud Credit สำหรับนักศึกษา",
    ],
  },
];

export default async function WelfarePage() {
  const ps = await getPageSetting("students_welfare").catch(() => null);
  const pageTitle = ps?.title ?? "สวัสดิการและสิ่งอำนวยความสะดวก";
  const pageDescription =
    ps?.description ??
    "ทุน ห้องแล็บ คำปรึกษา และพื้นที่ทำงานนอกห้องเรียน ทุกอย่างที่ช่วยให้คุณเรียนรู้ได้เต็มที่";
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "ดูแลนักศึกษา"}
        title={pageTitle}
        description={pageDescription}
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "นักศึกษาปัจจุบัน" },
              { label: "สวัสดิการ" },
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

      <section className="section">
        <div className="container-wide">
          <SectionTitle eyebrow="6 ด้านที่เราดูแล" title="ครอบคลุมทั้งการเรียนและการใช้ชีวิต" />
       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {items.map((it) => (
              <div
                key={it.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-brand mb-4">
                  {it.icon}
                </div>
                <h3 className="font-semibold text-slate-900 text-lg">{it.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{it.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {it.bullets.map((b) => (
                    <li
                      key={b}
                      className="text-xs text-slate-600 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-wide">
          <div className="rounded-3xl bg-brand-gradient text-white p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />
            <div className="relative flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold lg:text-3xl">
                  มีปัญหาหรือข้อสงสัย?
                </h2>
                <p className="text-white/90 mt-2 max-w-xl">
                  ติดต่อเจ้าหน้าที่หรือส่งความคิดเห็นได้ตลอด เราพร้อมรับฟังและปรับปรุง
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/about/contact"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-white text-brand-600 rounded-2xl font-medium hover:opacity-95"
                >
                  ติดต่อเจ้าหน้าที่
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/students/complaint"
                  className="inline-flex items-center gap-2 h-12 px-6 border border-white/70 rounded-2xl font-medium hover:bg-white/10"
                >
                  ส่งความคิดเห็น/ร้องเรียน
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
