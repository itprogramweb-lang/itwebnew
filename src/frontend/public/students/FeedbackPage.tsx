import Link from "next/link";
import { MessageCircle, ArrowRight, Star, Lightbulb, ThumbsUp } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/ui/primitives";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";

const channels = [
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "ร้องเรียน / ความคิดเห็นเร่งด่วน",
    desc: "ถ้ามีปัญหาที่ต้องการให้แก้ไขโดยเร็ว หรืออยากส่งเรื่องร้องเรียนโดยตรง",
    cta: "ส่งเรื่องร้องเรียน",
    href: "/students/complaint",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "ประเมินการสอน",
    desc: "ประเมินคุณภาพการเรียนการสอนผ่านระบบประเมินของมหาวิทยาลัย ติดต่อสอบถามช่องทางการประเมินได้ที่สาขา",
    cta: "ติดต่อสอบถาม",
    href: "/about/contact",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "ข้อเสนอแนะทั่วไป",
    desc: "มีไอเดียหรืออยากเสนอสิ่งที่อยากเห็นในสาขา? ส่งมาบอกเราได้เลย",
    cta: "ส่งข้อเสนอแนะ",
    href: "/students/complaint",
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: "ติดต่อโดยตรง",
    desc: "พูดคุยกับอาจารย์หรือเจ้าหน้าที่สาขาโดยตรงผ่านช่องทางติดต่อ",
    cta: "ติดต่อสาขา",
    href: "/about/contact",
  },
];

export default async function FeedbackPage() {
  const ps = await getPageSetting("students_feedback").catch(() => null);
  const pageTitle = ps?.title ?? "ความคิดเห็น / ข้อเสนอแนะ";
  const pageDescription =
    ps?.description ??
    "เสียงของนักศึกษาช่วยพัฒนาสาขา ร่วมแสดงความคิดเห็นเพื่อสร้างประสบการณ์การเรียนที่ดีขึ้น";
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;
  const ctaLabel = ps?.cta_label ?? null;
  const ctaUrl = ps?.cta_url ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "ความคิดเห็นนักศึกษา"}
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
            eyebrow="ช่องทางให้ความคิดเห็น"
            title="เลือกช่องทางที่เหมาะกับคุณ"
            description="มีหลายช่องทางให้คุณแสดงความคิดเห็นและข้อเสนอแนะ"
          />
          <div className="grid sm:grid-cols-2 gap-5">
            {channels.map((ch) => (
              <Link
                key={ch.title}
                href={ch.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 card-hover flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-brand mb-4 group-hover:scale-110 transition-transform shrink-0">
                  {ch.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{ch.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{ch.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {ch.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(ctaLabel && ctaUrl) && (
        <section className="pb-16">
          <div className="container-wide">
            <div className="rounded-3xl bg-brand-gradient text-white p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-mesh opacity-30" />
              <div className="relative flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{ctaLabel}</h2>
                </div>
                <Link
                  href={ctaUrl}
                  target={ps?.cta_external ? "_blank" : undefined}
                  rel={ps?.cta_external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 h-11 px-5 bg-white text-brand-600 rounded-2xl font-medium text-sm hover:opacity-95 shrink-0"
                >
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
