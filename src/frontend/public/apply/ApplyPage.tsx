import {
  ClipboardCheck,
  FileText,
  Send,
  CreditCard,
  Megaphone,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Phone,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { SectionTitle } from "@/components/ui/primitives";
import { applyFaqs } from "@/data/faqs";
import { getSiteSettings, getPageSetting } from "@/lib/supabase/queries";
import ApplyHero from "@/frontend/public/apply/ApplyHero";

// 1. คง 6 ขั้นตอนเดิมไว้
const steps = [
  {
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "ตรวจสอบคุณสมบัติ",
    description: "ตรวจสอบคุณสมบัติของผู้สมัครให้ตรงตามที่หลักสูตรกำหนด เช่น วุฒิการศึกษา และเกรดเฉลี่ย",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "เตรียมเอกสาร",
    description: "เตรียมเอกสารส่วนตัวและเอกสารการศึกษาให้พร้อมตามที่ระบบของแต่ละรอบระบุไว้",
  },
  {
    icon: <Send className="w-6 h-6" />,
    title: "สมัครผ่านระบบ",
    description: "เข้าระบบรับสมัครออนไลน์ กรอกข้อมูลและอัปโหลดเอกสารตามขั้นตอนของรอบนั้น ๆ",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "ชำระค่าสมัคร",
    description: "ชำระค่าธรรมเนียมการสมัครผ่านช่องทางที่ระบบกำหนด พร้อมเก็บหลักฐานไว้",
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: "ตรวจสอบประกาศผล",
    description: "ติดตามประกาศผลการคัดเลือกผ่านเว็บไซต์มหาวิทยาลัยหรือระบบกลางตามกำหนดการ",
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    title: "รายงานตัว",
    description: "รายงานตัวยืนยันสิทธิ์เป็นนักศึกษาใหม่ตามวันและช่องทางที่มหาวิทยาลัยกำหนด",
  },
];

// 2. ปรับคุณสมบัติกว้างๆ ไม่เจาะจงสายการเรียน และระบุพื้นฐานวิทย์-คณิต / การเขียนโปรแกรม
const qualifications = [
  "สำเร็จการศึกษาระดับมัธยมศึกษาตอนปลาย (ม.6) หรือ ปวช. / ปวส.",
  "รับนักเรียนที่มีพื้นฐานทักษะคณิตศาสตร์และวิทยาศาสตร์ (จำนวนหน่วยกิตและเกรดเฉลี่ยเป็นไปตามเงื่อนไขของแต่ละรอบ)",
  "ควรมีพื้นฐานการเขียนโปรแกรม หรือมีความสนใจอย่างแรงกล้าทางด้านเทคโนโลยีและการแก้ปัญหาเชิงระบบ",
  "มีเกรดเฉลี่ยสะสม (GPAX) เป็นไปตามเกณฑ์ขั้นต่ำที่กำหนดในรอบนั้น ๆ",
];

// 3. ปรับรอบการสมัครเป็นลำดับ Timeline (MOU -> TCAS 1 -> TCAS 2 -> TCAS 3 -> Direct)
const timelineRounds = [
  {
    step: "01",
    label: "รอบโควตาพิเศษ (MOU)",
    period: "ตุลาคม - พฤศจิกายน",
    desc: "สำหรับโรงเรียนหรือวิทยาลัยที่มีข้อตกลงความร่วมมือทางวิชาการกับมหาวิทยาลัย พิจารณาคัดเลือกก่อนรอบทั่วไป",
  },
  {
    step: "02",
    label: "TCAS รอบ 1 (Portfolio)",
    period: "ธันวาคม - มกราคม",
    desc: "พิจารณาจากแฟ้มสะสมผลงาน เน้นผู้มีความสามารถพิเศษ กิจกรรมโดดเด่น หรือมีโปรเจกต์ด้านไอที",
  },
  {
    step: "03",
    label: "TCAS รอบ 2 (Quota)",
    period: "กุมภาพันธ์ - มีนาคม",
    desc: "โควตาพื้นที่ ภูมิภาค โควตาความสามารถพิเศษ และโควตาเครือข่ายสถานศึกษา",
  },
  {
    step: "04",
    label: "TCAS รอบ 3 (Admission)",
    period: "เมษายน - พฤษภาคม",
    desc: "ระบบรับสมัครส่วนกลาง (myTCAS) พิจารณาโดยใช้คะแนนสอบระดับชาติ TGAT / TPAT / A-Level",
  },
  {
    step: "05",
    label: "รอบ Direct Admission",
    period: "พฤษภาคม - มิถุนายน",
    desc: "รับสมัครตรงโดยมหาวิทยาลัย (เปิดรับกรณีที่ยังมีที่นั่งว่างจากรอบก่อนหน้า) พิจารณาตามเกณฑ์ของสาขาวิชา",
  },
];

export default async function ApplyPage() {
  const [settings, ps] = await Promise.all([
    getSiteSettings().catch(() => null),
    getPageSetting("apply").catch(() => null),
  ]);

  const heroImageUrl = ps?.hero_image_url ?? settings?.apply_hero_image_url ?? null;

  const rawHeroTemplate =
    ps?.hero_layout && ps.hero_layout !== "default"
      ? ps.hero_layout
      : settings?.apply_hero_template ?? null;

  const heroTemplate =
    rawHeroTemplate && rawHeroTemplate !== "default" && rawHeroTemplate !== "no-image-clean"
      ? rawHeroTemplate
      : heroImageUrl
        ? "background-overlay"
        : "no-image-clean";

  const heroImageCrop =
    ps?.hero_image_crop_settings ?? settings?.apply_image_crop_settings ?? null;

  const heroTitle = ps?.title ?? settings?.apply_title ?? "สมัครเรียนกับเรา ก้าวเข้าสู่โลก IT";
  const heroEyebrow = ps?.subtitle ?? settings?.apply_eyebrow ?? "ปีการศึกษา 2568";
  const heroDescription =
    ps?.description ??
    settings?.apply_description ??
    "ตรวจสอบขั้นตอน คุณสมบัติ และกำหนดการรอบรับสมัครเพื่อเตรียมความพร้อมเข้าสู่รั้วมหาวิทยาลัย";

  return (
    <>
      <ApplyHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={heroTitle}
        eyebrow={heroEyebrow}
        description={heroDescription}
      />

      {/* 1. Steps Section */}
      <section className="section">
        <div className="container-wide">
          <SectionTitle
            eyebrow="ขั้นตอนการสมัคร"
            title="6 ขั้นตอน ไม่ซับซ้อน"
            description="ทำตามขั้นตอนเหล่านี้แล้วคุณจะพร้อมเข้าสู่กระบวนการสมัครเรียนได้ทันที"
            align="center"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 card-hover"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                    {i + 1}
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-brand shrink-0">
                    {s.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Qualifications Section & Split Links (ลบส่วนเอกสารออกแล้ว) */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide grid md:grid-cols-5 gap-8 lg:gap-12 items-start">
          <div className="md:col-span-3">
            <SectionTitle
              eyebrow="คุณสมบัติผู้สมัคร"
              title="ใครสมัครได้บ้าง?"
              description="เปิดรับสมัครผู้จบการศึกษาทุกแผนการเรียนที่มีความสนใจและพร้อมพัฒนาทักษะด้านเทคโนโลยีสารสนเทศ"
            />
            <ul className="space-y-3.5">
              {qualifications.map((q, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 lg:p-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">ตรวจสอบเกณฑ์และสมัครเรียน</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              * โปรดเลือกช่องทางเชื่อมต่อไปยังระบบหลักตามวุฒิการศึกษาของคุณ เพื่อตรวจสอบรายละเอียดและเงื่อนไขของแต่ละรอบ
            </p>
            <div className="space-y-4">
              <a
                href="https://course.mytcas.com/programs/31910109220101A"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-brand-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <span className="block text-xs font-semibold text-brand-600 mb-0.5">ผู้สมัครวุฒิ ม.6</span>
                  <span className="text-sm font-medium text-slate-800">ระบบกลาง MyTCAS</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition" />
              </a>

              <a
                href="https://oreg.rmutt.ac.th/Apply/?page_id=20"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-brand-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <span className="block text-xs font-semibold text-brand-600 mb-0.5">ผู้สมัครวุฒิ ปวช. / ปวส. (รอบ MOU)</span>
                  <span className="text-sm font-medium text-slate-800">ระบบรับสมัครมหาวิทยาลัย (MOU)</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition" />
              </a>

              <a
                href="https://oreg.rmutt.ac.th/Apply/?page_id=3243"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-brand-500 hover:shadow-md transition text-left group"
              >
                <div>
                  <span className="block text-xs font-semibold text-brand-600 mb-0.5">ผู้สมัครวุฒิ ปวช. / ปวส. (รอบทั่วไป)</span>
                  <span className="text-sm font-medium text-slate-800">ระบบรับสมัครมหาวิทยาลัย</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Timeline Rounds Section */}
      <section className="section overflow-hidden">
        <div className="container-wide">
          <SectionTitle
            eyebrow="รอบรับสมัคร"
            title="เส้นทางการรับสมัครเรียน"
            description="ลำดับการเปิดรับสมัครในแต่ละรอบการศึกษา โปรดวางแผนและติดตามกำหนดการอย่างใกล้ชิด"
          />

          {/* Timeline Wrapper */}
          <div className="relative mt-8 after:absolute after:inset-y-0 after:left-4 md:after:left-1/2 after:w-0.5 after:bg-slate-200">
            {timelineRounds.map((r, idx) => (
              <div
                key={r.step}
                className={`relative flex flex-col md:flex-row mb-12 last:mb-0 ${
                  idx % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-brand">
                  {r.step}
                </div>

                {/* Content Block */}
                <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-sm font-semibold text-brand-600 bg-brand-50/60 px-3 py-1 rounded-full">
                        {r.label}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{r.period}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{r.desc}</p>
                  </div>
                </div>

                {/* Empty block for layout balancing on desktop */}
                <div className="hidden md:block w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Fees Section (ระบุเฉพาะค่าเทอมคงที่ ตลอดหลักสูตร) */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="ค่าธรรมเนียมการศึกษา"
            title="ค่าเทอมเข้าถึงได้ แบ่งชำระตามเทอม"
            description="อัตราค่าเล่าเรียนแบบเหมาจ่ายคงที่ เพื่อการวางแผนค่าใช้จ่ายทางการศึกษาตลอดหลักสูตร"
          />
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-brand-50/30 to-orange-50/30 border border-brand-100 rounded-3xl p-6 lg:p-8 text-center shadow-sm">
            <div className="text-sm text-slate-500 mb-2 font-medium">ค่าธรรมเนียมการศึกษา (ภาคปกติ)</div>
            <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">16,000 บาท</div>
            <div className="text-sm font-semibold text-brand-600 bg-white inline-block px-4 py-1.5 rounded-full border border-brand-100 shadow-2xs">
              ต่อภาคการศึกษา ตลอดหลักสูตร
            </div>
          </div>
          <p className="text-xs text-center text-slate-400 mt-5">
            * อัตราค่าธรรมเนียมอาจมีการเปลี่ยนแปลงตามประกาศและนโยบายล่าสุดของมหาวิทยาลัย
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container-wide max-w-4xl">
          <SectionTitle
            eyebrow="คำถามที่พบบ่อย"
            title="FAQ สมัครเรียน"
            align="center"
          />
          <div className="space-y-3">
            {applyFaqs.map((f, i) => (
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

      {/* CTA */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-center text-white lg:p-14">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />
            <div className="relative">
              <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
                พร้อมก้าวสู่อนาคต IT แล้วหรือยัง?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/90">
                สมัครเรียนวันนี้เพื่อเริ่มต้นการเรียนรู้ในโลกดิจิทัลกับเรา
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a
                  href="https://oreg.rmutt.ac.th/Apply/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-base font-medium text-brand-600 shadow-sm transition hover:bg-orange-50"
                >
                  สมัครเรียนตอนนี้
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/about/contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/10 px-6 text-base font-medium text-white transition hover:bg-white/20"
                >
                  ติดต่อสอบถาม
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}