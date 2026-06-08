import {
  Target,
  Compass,
  Sparkles,
  Lightbulb,
  Code2,
  Database,
  Network,
  Bot,
  Briefcase,
  Users,
  Award,
  Trophy,
} from "lucide-react";

import { siteData, siteStats } from "@/data/site";
import { SectionTitle, FeatureCard } from "@/components/ui/primitives";
// 🛠️ แก้ไขการ import มาเรียกใช้งานแบนเนอร์กลางชิ้นใหม่ที่แชร์ไว้ใน components/ui
import PageHero from "@/components/ui/PageHero";
import { getPageSetting } from "@/lib/supabase/queries";

const mission = [
  "ผลิตบัณฑิตที่มีทักษะวิชาชีพและทักษะการแก้ปัญหาเชิงระบบ",
  "ส่งเสริมการวิจัยและพัฒนาเทคโนโลยีที่ตอบโจทย์อุตสาหกรรมและสังคม",
  "บริการวิชาการสู่ชุมชน สร้างความร่วมมือกับองค์กรภายนอก",
  "พัฒนาอาจารย์และบุคลากรให้มีคุณภาพระดับสากล",
  "ส่งเสริมการเรียนรู้ตลอดชีวิตและทักษะดิจิทัลแก่สังคมไทย",
];

const learnings = [
  {
    icon: <Code2 className="w-6 h-6" />,
    title: "การพัฒนาซอฟต์แวร์",
    desc: "Web, Mobile, Desktop ทุกแพลตฟอร์ม พร้อม best practice ของอุตสาหกรรม",
  },
  {
    icon: <Database className="w-6 h-6" />,
    title: "ระบบฐานข้อมูล & Data",
    desc: "ออกแบบฐานข้อมูล วิเคราะห์ข้อมูลด้วยเครื่องมือ Data Engineer/Analyst",
  },
  {
    icon: <Network className="w-6 h-6" />,
    title: "เครือข่ายและคลาวด์",
    desc: "ออกแบบเครือข่ายองค์กร Cloud Architecture และ DevOps",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI / Machine Learning",
    desc: "เรียนตั้งแต่พื้นฐานคณิตศาสตร์ ไปจนถึงโมเดลเชิงลึก",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "การบริหารโครงการ IT",
    desc: "Agile, Scrum, การวางแผน Sprint และทำงานเป็นทีม",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "UX/UI & การออกแบบ",
    desc: "ออกแบบประสบการณ์ผู้ใช้ที่สวยและใช้ง่ายตามหลัก HCI",
  },
];

const atmosphere = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "บรรยากาศเพื่อนช่วยเพื่อน",
    desc: "ห้องแล็บเปิด 24/7 สำหรับนักศึกษา ทำงานกลุ่มและฝึก coding ร่วมกัน",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "เวทีประกวดต่อเนื่อง",
    desc: "ส่งนักศึกษาเข้าแข่งขัน Hackathon, รางวัลโครงงานระดับชาติทุกปี",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "เชื่อมโยงอุตสาหกรรม",
    desc: "ภาคีพาร์ทเนอร์กว่า 30 บริษัทพร้อมรับฝึกงานและทำสหกิจ",
  },
];

export default async function AboutPage() {
  const ps = await getPageSetting("about").catch(() => null);

  const pageTitle =
    ps?.title ?? `${siteData.departmentName} ${siteData.facultyName}`;

  const pageDescription =
    ps?.description ??
    "สาขาที่มุ่งสร้างบัณฑิตที่พร้อมก้าวสู่โลกดิจิทัล ด้วยการเรียนรู้แบบลงมือทำจริง พร้อมเครือข่ายอาจารย์และพันธมิตรในอุตสาหกรรม";

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
      {/* 🚀 เรียกใช้งานแบนเนอร์กลาง PageHero สไตล์เตี้ยกระชับ คลีนชิดซ้าย สว่างละมุนตา */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={pageTitle}
        eyebrow={ps?.subtitle ?? "เกี่ยวกับสาขา"}
        description={pageDescription}
      />

      {/* History */}
      <section className="section">
        <div className="container-wide grid items-center gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionTitle
              eyebrow="ประวัติสาขา"
              title="จากห้องเรียนเล็ก สู่ผู้นำด้านเทคโนโลยีสารสนเทศ"
            />

            <div className="space-y-4 leading-relaxed text-slate-600">
              <p>
                สาขาเทคโนโลยีสารสนเทศ {siteData.universityName} ก่อตั้งขึ้นเพื่อตอบสนองความต้องการของอุตสาหกรรมเทคโนโลยีที่เติบโตอย่างรวดเร็ว
                ตลอดระยะเวลากว่า 22 ปี เราได้ผลิตบัณฑิตคุณภาพออกสู่ตลาดแรงงานอย่างต่อเนื่อง
                และได้รับการยอมรับจากองค์กรชั้นนำทั้งในและต่างประเทศ
              </p>

              <p>
                หลักสูตรของเราได้รับการพัฒนาอย่างต่อเนื่องเพื่อตามให้ทันเทคโนโลยีใหม่ ๆ
                ทั้ง Cloud Computing, Artificial Intelligence, Cybersecurity และ Internet of Things
                โดยเน้นการเรียนรู้แบบ Project-based ที่นักศึกษาได้ลงมือทำจริงตั้งแต่ปีแรก
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            {siteStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm shadow-slate-950/[0.03]"
              >
                <div className="gradient-text text-3xl font-semibold">
                  {s.value}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section border-y border-slate-100 bg-white">
        <div className="container-wide grid gap-8 md:grid-cols-2 lg:gap-12">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white lg:p-10">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />

            <div className="relative">
              <Compass className="mb-4 h-10 w-10" />

              <h3 className="text-2xl font-semibold">
                วิสัยทัศน์
              </h3>

              <p className="mt-4 leading-relaxed text-white/95">
                เป็นสาขาวิชาเทคโนโลยีสารสนเทศชั้นนำของประเทศ ที่สร้างบัณฑิตคุณภาพสูง
                พร้อมขับเคลื่อนการเปลี่ยนแปลงดิจิทัลของประเทศไทย ภายในปี 2570
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-950/[0.03] lg:p-10">
            <Target className="mb-4 h-10 w-10 text-brand-500" />

            <h3 className="text-2xl font-semibold text-slate-900">
              พันธกิจ
            </h3>

            <ul className="mt-4 space-y-2.5">
              {mission.map((m) => (
                <li
                  key={m}
                  className="flex gap-3 text-sm leading-relaxed text-slate-600"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* What students learn */}
      <section className="section">
        <div className="container-wide">
          <SectionTitle
            eyebrow="สิ่งที่นักศึกษาจะได้เรียน"
            title="ทักษะที่ตลาดงานต้องการ"
            description="หลักสูตรครอบคลุมทักษะหลักของอุตสาหกรรมเทคโนโลยีทั้งหมด เน้นการเรียนรู้แบบลงมือทำ"
            align="center"
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {learnings.map((l) => (
              <FeatureCard
                key={l.title}
                icon={l.icon}
                title={l.title}
                description={l.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Atmosphere */}
      <section className="section border-y border-slate-100 bg-white">
        <div className="container-wide">
          <SectionTitle
            eyebrow="บรรยากาศการเรียน"
            title="เพื่อน อาจารย์ และโอกาสที่ผลักดันให้คุณก้าวหน้า"
            align="center"
          />

          <div className="grid gap-8 md:grid-cols-3">
            {atmosphere.map((a) => (
              <FeatureCard
                key={a.title}
                icon={a.icon}
                title={a.title}
                description={a.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section">
        <div className="container-wide max-w-3xl text-center">
          <Lightbulb className="mx-auto mb-4 h-10 w-10 text-brand-500" />

          <blockquote className="text-2xl font-semibold leading-snug text-slate-900 lg:text-3xl">
            &ldquo;เรียน IT ที่นี่ ไม่ใช่แค่เก่งโค้ด แต่ต้องเก่งคิด เก่งทำงานเป็นทีม
            และเก่งสร้างสิ่งใหม่ ๆ ที่มีคุณค่ากับสังคม&rdquo;
          </blockquote>

          <p className="mt-4 text-sm text-slate-500">
            — หัวหน้าสาขา
          </p>
        </div>
      </section>
    </>
  );
}