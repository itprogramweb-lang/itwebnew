"use client";

import Link from "next/link";
import {
  ArrowRight,
  Phone,
  FlaskConical,
  Code2,
  Network,
  ShieldCheck,
} from "lucide-react";
import CroppedImage from "@/components/ui/CroppedImage";
import type { ImageCropSettings } from "@/lib/imageCrop";

export type ApplyHeroProps = {
  template?: string | null;
  imageUrl: string | null;
  title: string;
  eyebrow: string;
  description: string;
  imageCropSettings?: ImageCropSettings | Record<string, unknown> | null;
};

const highlightCards = [
  {
    icon: FlaskConical,
    title: "พื้นที่ทดลองและลงมือทำ",
    description:
      "ฝึกปฏิบัติผ่านสภาพแวดล้อมที่รองรับซอฟต์แวร์ เครือข่าย ข้อมูล และระบบดิจิทัล",
    href: "/about/facilities",
  },
  {
    icon: Code2,
    title: "โปรเจกต์จริงทุกชั้นเรียน",
    description:
      "เรียนรู้ผ่านโจทย์จริง สร้างผลงานสะสม และต่อยอดเป็น Portfolio สำหรับสมัครงาน",
    href: "/works/students",
  },
  {
    icon: Network,
    title: "เครือข่ายสายเทคโนโลยี",
    description:
      "เชื่อมต่อกับชุมชนการเรียนรู้ บุคลากร และโอกาสทางวิชาชีพในสายดิจิทัล",
    href: null,
  },
  {
    icon: ShieldCheck,
    title: "วางพื้นฐานอย่างเป็นระบบ",
    description:
      "พัฒนาทักษะคิด วิเคราะห์ ออกแบบ และรับผิดชอบงานเทคโนโลยีอย่างมืออาชีพ",
    href: null,
  },
];

function CardBackground() {
  return (
    <>
      <div className="absolute inset-0 z-0 bg-slate-950/50 backdrop-blur-xl" />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950/75 via-slate-950/45 to-slate-950/25" />
    </>
  );
}

function Buttons({ center = false }: { center?: boolean }) {
  return (
    <div
      className={`mt-8 flex flex-wrap gap-3.5 ${
        center ? "justify-center" : "justify-start"
      }`}
    >
      <a
        href="https://apply.rmutt.ac.th/"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-gradient px-6 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:h-12 sm:text-base"
      >
        สมัครเรียนออนไลน์
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>

      <Link
        href="/about/contact"
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.08] sm:h-12 sm:text-base"
      >
        <Phone className="h-4 w-4 opacity-80" />
        ติดต่อสอบถาม
      </Link>
    </div>
  );
}

function HighlightCardContent({
  feature,
}: {
  feature: (typeof highlightCards)[number];
}) {
  const Icon = feature.icon;

  return (
    <div className="relative z-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
          <Icon className="h-7 w-7" />
        </div>

        {feature.href && (
          <span className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-orange-300 transition-colors group-hover:text-orange-200">
            ดูรายละเอียด
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
        {feature.title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {feature.description}
      </p>
    </div>
  );
}

function HighlightCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {highlightCards.map((feature) => {
        const cardClassName =
          "group relative overflow-hidden rounded-[2rem] border border-white/20 p-6 shadow-2xl shadow-black/45 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/70 hover:shadow-orange-950/30";

        const hoverRing = (
          <div className="pointer-events-none absolute inset-0 z-0 rounded-[2rem] ring-1 ring-transparent transition-all duration-300 group-hover:ring-orange-400/60" />
        );

        if (feature.href) {
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className={cardClassName}
            >
              <CardBackground />
              {hoverRing}
              <HighlightCardContent feature={feature} />
            </Link>
          );
        }

        return (
          <article key={feature.title} className={cardClassName}>
            <CardBackground />
            {hoverRing}
            <HighlightCardContent feature={feature} />
          </article>
        );
      })}
    </div>
  );
}

export default function ApplyHero({
  template,
  imageUrl,
  title,
  eyebrow,
  description,
  imageCropSettings,
}: ApplyHeroProps) {
  const useNoImageLayout = !imageUrl || template === "no-image-clean";

  if (useNoImageLayout) {
    return (
      <section className="relative flex min-h-[340px] items-center overflow-hidden border-b border-slate-900 bg-slate-950 text-white">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_0%_40%,rgba(249,115,22,0.14),transparent_35%)]" />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#030612] via-[#060a17] to-[#02050b]" />
        <div className="border-site-gradient-line absolute inset-x-0 bottom-0 z-10 h-px" />

        <div className="container-wide relative z-10 px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {eyebrow && (
              <div className="mb-5 inline-flex items-center rounded-full border border-white/5 bg-white/[0.04] px-4 py-1.5 text-xs font-normal tracking-wide text-[#e0a955] shadow-sm backdrop-blur-md">
                {eyebrow}
              </div>
            )}

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {description && (
              <p className="mt-5 max-w-2xl text-base font-normal leading-relaxed tracking-wide text-slate-300 opacity-85 lg:text-lg">
                {description}
              </p>
            )}

            <Buttons />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
      <div className="absolute inset-0 z-0 h-full w-full">
        <CroppedImage
          src={imageUrl}
          alt={title}
          crop={imageCropSettings}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="absolute inset-0 z-[1] bg-slate-950/25 backdrop-brightness-[0.9]" />
      <div className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-slate-950/50 via-slate-950/15 to-transparent" />

      <div className="container-wide relative z-10 flex min-h-[560px] items-center py-14 sm:py-16 lg:min-h-[calc(100svh-88px)] lg:py-20">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.95fr_2fr]">
          {/* กล่องสมัครเรียน */}
          <div className="w-full max-w-xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/20 p-6 shadow-2xl shadow-black/45 sm:rounded-[2.5rem] sm:p-9 lg:p-11">
              <CardBackground />

              <div className="relative z-10 text-left">
                {eyebrow && (
                  <p className="mb-4 inline-flex max-w-full rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-200 backdrop-blur-md">
                    {eyebrow}
                  </p>
                )}

                <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {title}
                </h1>

                {description && (
                  <p className="max-w-lg text-sm leading-relaxed text-slate-200/90 sm:text-base">
                    {description}
                  </p>
                )}

                <Buttons />
              </div>
            </div>
          </div>

          {/* card 4 อัน เรียงเหมือนหน้าหลัก */}
          <div className="w-full">
            <HighlightCards />
          </div>
        </div>
      </div>
    </section>
  );
}