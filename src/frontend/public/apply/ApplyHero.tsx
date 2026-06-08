"use client";

import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
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

// 🛠️ ปรับโฉมดีไซน์ปุ่มกด (Buttons) ให้มีความพรีเมียมและโดดเด่นเป็น Action หลักของหน้า
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
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-gradient px-6 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:h-12 sm:text-base"
      >
        สมัครเรียนออนไลน์
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>

      <Link
        href="/about/contact"
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/[0.08] hover:border-white/25 sm:h-12 sm:text-base"
      >
        <Phone className="h-4 w-4 opacity-80" />
        ติดต่อสอบถาม
      </Link>
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

  // ============================================================
  // ✨ กรณีไม่ได้กำหนดรูปภาพ (Clean Text & Beautiful Gradient Like image_03c4e8.jpg)
  // ============================================================
  if (useNoImageLayout) {
    return (
      <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 text-white flex items-center min-h-[340px]">
        {/* Layer เอฟเฟกต์การไล่ระดับแสงสีส้มแอมเบอร์มุมซ้ายบน สาดส่องลงบนพื้นหลังสีมืดสนิท */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_40%,rgba(249,115,22,0.14),transparent_35%)] z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030612] via-[#060a17] to-[#02050b] z-0" />
        <div className="border-site-gradient-line absolute inset-x-0 bottom-0 h-px z-10" />

        <div className="container-wide relative z-10 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-left">
            {eyebrow && (
              <div className="mb-5 inline-flex items-center rounded-full border border-white/5 bg-white/[0.04] px-4 py-1.5 text-xs font-normal tracking-wide text-[#e0a955] backdrop-blur-md shadow-sm">
                {eyebrow}
              </div>
            )}

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {description && (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 font-normal tracking-wide opacity-85 lg:text-lg">
                {description}
              </p>
            )}

            <Buttons />
          </div>
        </div>
      </section>
    );
  }

 // ============================================================
  // ✨ กรณีมีรูปภาพ (เวอร์ชันลดขนาดความสูงลงเพื่อหลบ Navbar ไม่ให้สกรอลล์ยาว)
  // ============================================================
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white w-full">
      {/* รูปพื้นหลัง */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <CroppedImage
          src={imageUrl}
          alt={title}
          crop={imageCropSettings}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* ควบคุมโทนแสงภาพรวมให้ละมุน */}
      <div className="absolute inset-0 z-[1] bg-slate-950/20 backdrop-brightness-[0.9]" />

      {/* ม่านเงาสาดซับเงาบริเวณฐานขอบล่าง */}
      <div className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-gradient-to-t from-slate-950/40 via-slate-950/10 to-transparent" />

      {/* 🛠️ จุดที่แก้ไข:
          - หักลบความสูง Navbar ออกด้วย calc(100svh - 88px) เพื่อให้สัดส่วนสูงพอดีหน้าจอเป๊ะ ไม่ขาดไม่เกิน
          - หรือหากยังรู้สึกว่ายาวไป สามารถเปลี่ยนเป็น lg:min-h-[75vh] หรือ lg:min-h-[80vh] ได้ตามชอบเลยครับ */}
      <div className="container-wide relative z-10 flex min-h-[500px] items-center py-16 sm:py-20 lg:min-h-[calc(100svh-88px)] lg:py-24">
        <div className="w-full max-w-xl">
          
          {/* 💎 ตัวกล่องครอบสไตล์กระจกโปร่งใส (Glassmorphic Container) */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/20 p-7 shadow-2xl shadow-black/45 sm:p-9 lg:p-11">
            
            {/* พื้นหลังกระจกฝ้าซ้อน Layer ไล่ระดับความใส */}
            <div className="absolute inset-0 z-0 bg-slate-950/50 backdrop-blur-xl" />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950/75 via-slate-950/45 to-slate-950/25" />

            {/* เนื้อหาการจัดวางข้อความภายในกล่องแก้ว */}
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
      </div>
    </section>
  );
}