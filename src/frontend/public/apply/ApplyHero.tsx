import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import CroppedImage from "@/components/ui/CroppedImage";
import type { ImageCropSettings } from "@/lib/imageCrop";

export type ApplyHeroProps = {
  template: string;
  imageUrl: string | null;
  title: string;
  eyebrow: string;
  description: string;
  imageCropSettings?: ImageCropSettings | Record<string, unknown> | null;
};

function Buttons({ center = false }: { center?: boolean }) {
  return (
    <div
      className={`mt-6 flex flex-wrap gap-3 ${
        center ? "justify-center" : ""
      }`}
    >
      <button
        type="button"
        disabled
        title="จะประกาศลิงก์รับสมัครเร็วๆ นี้"
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-gradient px-5 text-sm font-medium text-white opacity-70 shadow-brand cursor-not-allowed sm:h-12 sm:px-6 sm:text-base"
      >
        ไปยังระบบรับสมัคร
        <ArrowRight className="h-4 w-4" />
      </button>

      <Link
        href="/about/contact"
        className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/30 bg-slate-950/35 px-5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:h-12 sm:px-6 sm:text-base"
      >
        <Phone className="h-4 w-4" />
        ติดต่อเจ้าหน้าที่
      </Link>
    </div>
  );
}

export default function ApplyHero({
  imageUrl,
  title,
  eyebrow,
  description,
  imageCropSettings,
}: ApplyHeroProps) {
  if (!imageUrl) {
    return (
      <section className="bg-slate-950 text-white">
        <div className="container-wide py-20 text-center lg:py-28">
          <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-semibold text-brand-200">
            {eyebrow}
          </p>

          <h1 className="mx-auto mb-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300">
            {description}
          </p>

          <Buttons center />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
   <div className="relative min-h-[380px] overflow-hidden sm:min-h-[420px] lg:min-h-[480px]">
        <div className="absolute inset-0 z-0">
          <CroppedImage
            src={imageUrl}
            alt={title}
            crop={imageCropSettings}
            className="h-full w-full object-cover object-center"
          />
        </div>

        {/* ไม่มี overlay ทั้งภาพ */}

        {/* ข้อความวางทับบนรูป */}
        <div className="container-wide relative z-10 flex min-h-[520px] items-center py-12 sm:min-h-[560px] sm:py-16 lg:min-h-[620px] lg:py-20">
          <div className="w-full max-w-xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
              {/* fade เฉพาะกล่องข้อความ */}
              <div className="absolute inset-0 z-0 bg-slate-950/45 backdrop-blur-sm" />
<div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950/55 via-slate-950/35 to-slate-950/20" />
              <div className="relative z-10">
                <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-brand-200">
                  {eyebrow}
                </p>

                <h1 className="mb-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  {title}
                </h1>

                <p className="max-w-lg text-base leading-relaxed text-slate-100 sm:text-lg">
                  {description}
                </p>

                <Buttons />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}