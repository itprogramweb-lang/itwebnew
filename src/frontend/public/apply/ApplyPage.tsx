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
} from "lucide-react";
import { SectionTitle, FeatureCard } from "@/components/ui/primitives";
import Button from "@/components/ui/Button";
import { applyFaqs } from "@/data/faqs";
import { getSiteSettings, getPageSetting } from "@/lib/supabase/queries";
import ApplyHero from "@/frontend/public/apply/ApplyHero";

const steps = [
  {
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "ตรวจสอบคุณสมบัติ",
    description:
      "ตรวจสอบคุณสมบัติของผู้สมัครให้ตรงตามที่หลักสูตรกำหนด เช่น วุฒิการศึกษา สายการเรียน และเกรดเฉลี่ย",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "เตรียมเอกสาร",
    description:
      "เตรียมเอกสารทั้งหมดให้พร้อม เช่น ใบ ปพ.1 บัตรประชาชน รูปถ่าย และพอร์ตโฟลิโอ (ถ้ามี)",
  },
  {
    icon: <Send className="w-6 h-6" />,
    title: "สมัครผ่านระบบ",
    description:
      "เข้าระบบรับสมัครออนไลน์ของมหาวิทยาลัย กรอกข้อมูลและอัปโหลดเอกสารตามที่กำหนด",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    title: "ชำระค่าสมัคร",
    description:
      "ชำระค่าธรรมเนียมการสมัครผ่านช่องทางที่ระบบกำหนด พร้อมเก็บหลักฐานไว้",
  },
  {
    icon: <Megaphone className="w-6 h-6" />,
    title: "ตรวจสอบประกาศผล",
    description:
      "ติดตามประกาศผลการคัดเลือกผ่านเว็บไซต์มหาวิทยาลัยและเว็บไซต์สาขา",
  },
  {
    icon: <UserCheck className="w-6 h-6" />,
    title: "รายงานตัว",
    description:
      "รายงานตัวเป็นนักศึกษาใหม่ตามวันและช่องทางที่มหาวิทยาลัยกำหนด",
  },
];

const qualifications = [
  "สำเร็จการศึกษาระดับมัธยมศึกษาตอนปลาย (ม.6) หรือ ปวช./ปวส. ทุกสาขา",
  "เกรดเฉลี่ยสะสมไม่ต่ำกว่า 2.00 (อาจมีการเปลี่ยนแปลงตามรอบ)",
  "มีความสนใจทางด้านเทคโนโลยี การเขียนโปรแกรม หรือการแก้ปัญหาเชิงระบบ",
  "มีพื้นฐานคณิตศาสตร์ และภาษาอังกฤษพอใช้",
  "สำหรับนักศึกษาต่างชาติ จำเป็นต้องมีผลคะแนนภาษาตามที่กำหนด",
];

const documents = [
  "สำเนาใบ ปพ.1 หรือใบรับรองผลการเรียน",
  "สำเนาบัตรประชาชน",
  "สำเนาทะเบียนบ้าน",
  "รูปถ่ายขนาด 1 นิ้ว (ตามจำนวนที่ระบบกำหนด)",
  "ใบรับรองความสามารถพิเศษ (ถ้ามี)",
  "แฟ้มสะสมผลงาน Portfolio (เฉพาะรอบที่ใช้)",
  "หลักฐานการเปลี่ยนชื่อ-นามสกุล (ถ้ามี)",
];

const rounds = [
  {
    label: "TCAS รอบ 1",
    name: "Portfolio",
    period: "ธันวาคม - มกราคม",
    desc: "ใช้แฟ้มสะสมผลงาน เน้นผู้มีความสามารถพิเศษหรือกิจกรรมโดดเด่น",
  },
  {
    label: "TCAS รอบ 2",
    name: "Quota",
    period: "กุมภาพันธ์ - มีนาคม",
    desc: "โควตาภูมิภาค โควตาความสามารถพิเศษ และโควตาเครือข่าย",
  },
  {
    label: "TCAS รอบ 3",
    name: "Admission",
    period: "เมษายน - พฤษภาคม",
    desc: "รับสมัครผ่านระบบกลาง ใช้คะแนน TGAT/TPAT/A-Level",
  },
  {
    label: "TCAS รอบ 4",
    name: "Direct Admission",
    period: "พฤษภาคม - มิถุนายน",
    desc: "รับตรงโดยมหาวิทยาลัย พิจารณาตามเกณฑ์ของสาขา",
  },
];

const fees = [
  { label: "ค่าสมัคร", value: "500 บาท" },
  { label: "ค่าเทอม (ภาคปกติ)", value: "14,000 - 16,000 บาท/ภาคการศึกษา" },
  { label: "ค่ายืนยันสิทธิ์", value: "ตามประกาศของมหาวิทยาลัย" },
  { label: "ทุน กยศ. / กรอ.", value: "รองรับ" },
];

export default async function ApplyPage() {
  const [settings, ps] = await Promise.all([
    getSiteSettings().catch(() => null),
    getPageSetting("apply").catch(() => null),
  ]);

  // page_settings takes priority over site_settings (round 37 compat)
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

const heroTitle =
  ps?.title ?? settings?.apply_title ?? "สมัครเรียนกับเรา ก้าวเข้าสู่โลก IT";

const heroEyebrow =
  ps?.subtitle ?? settings?.apply_eyebrow ?? "ปีการศึกษา 2568";

const heroDescription =
  ps?.description ??
  settings?.apply_description ??
  "ครบทุกขั้นตอน คุณสมบัติ เอกสาร และรอบรับสมัคร พร้อมคำตอบสำหรับคำถามที่พบบ่อย เพื่อให้คุณสมัครได้อย่างราบรื่น";
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

      {/* Steps */}
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

      <p className="text-sm text-slate-600 leading-relaxed">
        {s.description}
      </p>
    </div>
  ))}
</div>
        </div>
      </section>

      {/* Qualifications & Documents */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <SectionTitle
              eyebrow="คุณสมบัติผู้สมัคร"
              title="ใครสมัครได้บ้าง?"
            />
            <ul className="space-y-3">
              {qualifications.map((q) => (
                <li key={q} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    {q}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionTitle
              eyebrow="เอกสารที่ต้องเตรียม"
              title="เตรียมเอกสารให้พร้อม"
            />
            <ul className="space-y-3">
              {documents.map((d) => (
                <li key={d} className="flex gap-3 items-start">
                  <FileText className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Rounds */}
      <section className="section">
        <div className="container-wide">
          <SectionTitle
            eyebrow="รอบรับสมัคร TCAS"
            title="เลือกรอบที่เหมาะกับคุณ"
            description="รับสมัครผ่านระบบ TCAS ของมหาวิทยาลัย ครอบคลุมทุกรอบเพื่อโอกาสที่หลากหลาย"
          />
         <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
            {rounds.map((r) => (
              <div
                key={r.label}
                className="rounded-3xl border border-slate-200 bg-white p-6 card-hover"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-brand-700">
                    {r.label}
                  </span>
                  <span className="text-xs text-slate-500">{r.period}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {r.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fees */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide">
          <SectionTitle
            eyebrow="ค่าใช้จ่าย & ทุนการศึกษา"
            title="ค่าเทอมเข้าถึงได้ ทุนหลากหลาย"
            description="ค่าใช้จ่ายเบื้องต้นและทุนการศึกษาที่นักศึกษาสาขาเข้าถึงได้"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fees.map((f) => (
              <div
                key={f.label}
                className="bg-brand-50/40 border border-brand-100 rounded-2xl p-5"
              >
                <div className="text-xs text-slate-500 mb-1">{f.label}</div>
                <div className="font-semibold text-slate-900">{f.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            * อัตราข้างต้นเป็นข้อมูลเบื้องต้น โปรดตรวจสอบประกาศปีการศึกษาล่าสุดจากมหาวิทยาลัยอีกครั้ง
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
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 lg:p-14 text-white text-center">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />
            <div className="relative">
              <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
                พร้อมก้าวสู่อนาคต IT แล้วหรือยัง?
              </h2>
              <p className="mt-3 text-white/90 max-w-xl mx-auto">
                สมัครเรียนวันนี้เพื่อเริ่มต้นการเรียนรู้ในโลกดิจิทัลกับเรา
              </p>
              <div className="mt-7 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  disabled
                  title="จะประกาศลิงก์รับสมัครเร็ว ๆ นี้"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium h-12 px-6 text-base rounded-2xl bg-white text-brand-600 opacity-60 cursor-not-allowed"
                >
                  สมัครเรียนตอนนี้
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Button
                  href="/about/contact"
                  variant="outline"
                  size="lg"
                  className="!border-white/70 !text-white hover:!bg-white/10"
                >
                  ติดต่อสอบถาม
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
