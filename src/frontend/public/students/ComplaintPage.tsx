import { Lock, ShieldCheck, MessageCircle, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import ComplaintForm from "@/components/forms/ComplaintForm";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";

const promises = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: "เก็บเป็นความลับ",
    desc: "ข้อมูลส่วนตัวของผู้ส่งจะไม่ถูกเปิดเผยต่อบุคคลภายนอก",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "เห็นเฉพาะผู้ดูแล",
    desc: "เห็นเฉพาะเจ้าหน้าที่ที่ได้รับสิทธิ์ในระบบเท่านั้น",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "ใช้เพื่อปรับปรุง",
    desc: "นำไปวิเคราะห์เพื่อปรับปรุงการให้บริการ ไม่ใช่เพื่อตัดสินผู้ส่ง",
  },
];

export default async function ComplaintPage() {
  const ps = await getPageSetting("students_complaint").catch(() => null);
  const pageTitle = ps?.title ?? "เสียงของคุณช่วยให้เราดีขึ้น";
  const pageDescription =
    ps?.description ??
    "ส่งข้อร้องเรียน เสนอแนะ หรือสะท้อนปัญหาที่พบ เราอ่านทุกเรื่อง ขอบคุณที่กล้าสะท้อนมา";
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "ร้องเรียน / ความคิดเห็น"}
        title={pageTitle}
        description={pageDescription}
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "นักศึกษาปัจจุบัน" },
              { label: "ร้องเรียน/ความคิดเห็น" },
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
        <div className="container-wide grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Promises */}
          <aside className="lg:col-span-2 space-y-3">
            <div className="bg-brand-gradient text-white rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-mesh opacity-30" />
              <div className="relative">
                <MessageCircle className="w-9 h-9 mb-3" />
                <h2 className="text-xl font-semibold">เราดูแลเรื่องของคุณอย่างไร</h2>
                <p className="text-sm text-white/90 mt-2 leading-relaxed">
                  เรื่องที่คุณส่งเข้ามาจะเข้าสู่ระบบและถูกส่งต่อให้ผู้รับผิดชอบ
                  พิจารณาโดยทันที ระยะเวลาในการตอบกลับขึ้นกับลักษณะของเรื่อง
                </p>
              </div>
            </div>
            {promises.map((p) => (
              <div
                key={p.title}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03]"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-50 grid place-items-center text-brand-600 shrink-0">
                  {p.icon}
                </div>
                <div>
                  <div className="font-medium text-slate-900 text-sm">{p.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </aside>

          {/* Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] lg:col-span-3 lg:p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">ส่งเรื่องของคุณ</h2>
            <p className="text-sm text-slate-500 mb-6">
              กรุณากรอกรายละเอียดให้ครบ ทีมงานจะดำเนินการตามขั้นตอนต่อไป
            </p>
            <ComplaintForm />
          </div>
        </div>
      </section>
    </>
  );
}
