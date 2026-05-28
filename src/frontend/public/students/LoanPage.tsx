import Link from "next/link";
import {
  CheckCircle2, Calendar, ExternalLink, ArrowRight,
  HelpCircle, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import { loanFaqs } from "@/data/faqs";
import CroppedImage from "@/components/ui/CroppedImage";
import { getSiteSettings, getPageSetting } from "@/lib/supabase/queries";

const DEFAULT_LOAN_URL = "https://sd.rmutt.ac.th/?page_id=2274";

const steps = [
  "ลงทะเบียนสมัครเป็นนักศึกษาในระบบของมหาวิทยาลัย",
  "ลงทะเบียน/สมัครยื่นกู้ในระบบ DSL ของ กยศ.",
  "กรอกข้อมูลผู้กู้และผู้ปกครองในระบบ DSL",
  "ยื่นเอกสารประกอบการกู้ตามที่ระบบและสาขากำหนด",
  "เข้ารับการสัมภาษณ์ (กรณีผู้กู้รายใหม่)",
  "รอประกาศผลการอนุมัติจาก กยศ.",
  "ลงนามสัญญากู้ยืมและเอกสารแบบยืนยัน",
  "กยศ. โอนค่าเล่าเรียนตรงให้กับมหาวิทยาลัย",
];

const documents = [
  "สำเนาบัตรประชาชนผู้กู้",
  "สำเนาทะเบียนบ้านผู้กู้",
  "สำเนาบัตรประชาชนบิดา-มารดา",
  "สำเนาทะเบียนบ้านบิดา-มารดา",
  "หนังสือรับรองรายได้ของครอบครัว",
  "หลักฐานการทำกิจกรรมจิตอาสา (ตามที่ กยศ. กำหนด)",
  "ใบ ปพ.1 / Transcript",
  "เอกสารอื่น ๆ ตามที่ กยศ. กำหนดในแต่ละปี",
];

const calendar = [
  { period: "พฤษภาคม", event: "เปิดระบบให้ผู้กู้รายใหม่ยื่นกู้ปีการศึกษานี้" },
  { period: "มิถุนายน", event: "ส่งเอกสารตัวจริงให้กับเจ้าหน้าที่สาขา" },
  { period: "กรกฎาคม", event: "สัมภาษณ์ผู้กู้รายใหม่" },
  { period: "สิงหาคม", event: "ลงนามสัญญาและแบบยืนยัน" },
  { period: "ตุลาคม", event: "กยศ. โอนค่าเล่าเรียนงวดที่ 1" },
];

export default async function LoanPage() {
  let loanUrl = DEFAULT_LOAN_URL;
  const [settings, ps] = await Promise.all([
    getSiteSettings().catch(() => null),
    getPageSetting("students_loan").catch(() => null),
  ]);
  if (settings?.loan_external_url) loanUrl = settings.loan_external_url;
  // CTA URL from page_settings overrides site_settings loan URL only if explicitly set
  if (ps?.cta_url) loanUrl = ps.cta_url;

  const pageTitle = ps?.title ?? "ข้อมูล กยศ. สำหรับนักศึกษา";
  const pageDescription =
    ps?.description ?? "ขั้นตอน เอกสาร และวันสำคัญ พร้อมลิงก์ไปยังระบบ กยศ. ของมหาวิทยาลัย";
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "กองทุนเงินให้กู้ยืมเพื่อการศึกษา"}
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

      {/* External CTA Banner */}
      <section className="pt-10">
        <div className="container-wide">
          <div className="rounded-3xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-brand">
            <div className="flex-1 text-white">
              <div className="font-bold text-lg">ระบบ กยศ. มหาวิทยาลัย (เว็บทางการ)</div>
              <p className="text-sm text-white/80 mt-1">
                ยื่นกู้ ตรวจสอบสถานะ และดาวน์โหลดเอกสารผ่านเว็บไซต์กองพัฒนานักศึกษา มทร.ธัญบุรี
              </p>
            </div>
            <a
              href={loanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 h-11 px-6 rounded-2xl bg-white text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors shadow-sm"
            >
              ไปยังระบบ กยศ.
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Warning */}
      <section className="pt-6">
        <div className="container-wide">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-amber-900">โปรดทราบ</div>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                ข้อมูลนี้เป็นข้อมูลเบื้องต้นเพื่อความสะดวก โปรดตรวจสอบรายละเอียดล่าสุดจาก{" "}
                <a href={loanUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  กองพัฒนานักศึกษา มทร.ธัญบุรี
                </a>{" "}
                อีกครั้งก่อนดำเนินการ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section">
        <div className="container-wide">
          <SectionTitle eyebrow="ขั้นตอนการกู้" title="8 ขั้นตอน กู้ กยศ. ให้ผ่าน" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s} className="rounded-2xl border border-slate-200 bg-white p-5 card-hover">
                <div className="mb-1 text-3xl font-semibold text-brand-100">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide">
          <SectionTitle eyebrow="เอกสารที่ต้องเตรียม" title="ลิสต์เอกสารแบบเช็คได้" />
          <div className="grid md:grid-cols-2 gap-3">
            {documents.map((d) => (
              <div key={d} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                <span className="text-sm text-slate-700">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar + Links */}
      <section className="section">
        <div className="container-wide grid lg:grid-cols-2 gap-8">
          <div>
            <SectionTitle eyebrow="วันสำคัญ" title="ปฏิทิน กยศ." />
            <ul className="space-y-2">
              {calendar.map((c) => (
                <li key={c.event} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <Calendar className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-brand-700">{c.period}</div>
                    <div className="text-sm text-slate-800 mt-0.5">{c.event}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionTitle eyebrow="ลิงก์สำคัญ" title="ระบบและช่องทางที่ใช้บ่อย" />
            <div className="space-y-2.5">
              <a
                href={loanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 card-hover"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-brand-500" />
                  <span className="font-medium text-slate-900">ระบบ กยศ. มทร.ธัญบุรี</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition" />
              </a>
              <Link
                href="/about/contact"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 card-hover"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-brand-500" />
                  <span className="font-medium text-slate-900">ติดต่อเจ้าหน้าที่สาขา</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white border-y border-slate-100">
        <div className="container-wide max-w-4xl">
          <SectionTitle eyebrow="คำถามที่พบบ่อย" title="FAQ กยศ." align="center" />
          <div className="space-y-3">
            {loanFaqs.map((f, i) => (
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
                <p className="mt-3 ml-8 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
