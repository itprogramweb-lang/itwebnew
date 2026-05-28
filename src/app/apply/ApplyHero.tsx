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
    <div className={`flex flex-wrap gap-3 mt-6 ${center ? "justify-center" : ""}`}>
      <button
        type="button"
        disabled
        title="จะประกาศลิงก์รับสมัครเร็วๆ นี้"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium h-12 px-6 text-base rounded-2xl bg-brand-gradient text-white opacity-60 cursor-not-allowed"
      >
        ไปยังระบบรับสมัคร
        <ArrowRight className="w-4 h-4" />
      </button>
      <Link
        href="/about/contact"
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium h-12 px-6 text-base rounded-2xl border border-white/30 text-white bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Phone className="w-4 h-4" />
        ติดต่อเจ้าหน้าที่
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
  const t = imageUrl ? template : "no-image-clean";
  const heroImage = (className: string) => (
    <CroppedImage src={imageUrl!} alt={title} crop={imageCropSettings} className={className.replace("object-cover", "").trim()} />
  );

  /* ── 1. wide-banner ────────────────────────────────────────────────────── */
  if (t === "wide-banner") {
    return (
      <div className="bg-slate-950 text-white">
        <div className="relative w-full h-52 sm:h-72 overflow-hidden">
          {heroImage("w-full h-full object-cover")}
          <div className="absolute inset-0 bg-slate-950/55" />
        </div>
        <div className="container-wide py-12">
          <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-3">{eyebrow}</p>
          <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">{description}</p>
          <Buttons />
        </div>
      </div>
    );
  }

  /* ── 2. split-left ─────────────────────────────────────────────────────── */
  if (t === "split-left") {
    return (
      <div className="bg-slate-950 text-white overflow-hidden">
        <div className="container-wide grid md:grid-cols-2 min-h-[380px] items-center gap-8">
          <div className="relative h-60 md:h-full rounded-3xl overflow-hidden my-8 md:my-0">
            {heroImage("w-full h-full object-cover")}
          </div>
          <div className="py-12 md:py-16">
            <p className="text-xs font-semibold text-brand-300 mb-3">{eyebrow}</p>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
            <p className="text-slate-300 leading-relaxed">{description}</p>
            <Buttons />
          </div>
        </div>
      </div>
    );
  }

  /* ── 3. split-right ────────────────────────────────────────────────────── */
  if (t === "split-right") {
    return (
      <div className="bg-slate-950 text-white overflow-hidden">
        <div className="container-wide grid md:grid-cols-2 min-h-[380px] items-center gap-8">
          <div className="py-12 md:py-16 order-last md:order-first">
            <p className="text-xs font-semibold text-brand-300 mb-3">{eyebrow}</p>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
            <p className="text-slate-300 leading-relaxed">{description}</p>
            <Buttons />
          </div>
          <div className="relative h-60 md:h-full rounded-3xl overflow-hidden my-8 md:my-0 order-first md:order-last">
            {heroImage("w-full h-full object-cover")}
          </div>
        </div>
      </div>
    );
  }

  /* ── 4. background-overlay ─────────────────────────────────────────────── */
  if (t === "background-overlay") {
    return (
      <div className="relative min-h-[460px] sm:min-h-[520px] flex items-center overflow-hidden">
        {heroImage("absolute inset-0 w-full h-full object-cover")}
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative container-wide py-20 text-white text-center">
          <p className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-4">{eyebrow}</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-snug mb-4 max-w-3xl mx-auto">{title}</h1>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">{description}</p>
          <Buttons center />
        </div>
      </div>
    );
  }

  /* ── 5. top-image ──────────────────────────────────────────────────────── */
  if (t === "top-image") {
    return (
      <div className="bg-slate-950 text-white">
        <div className="container-wide pt-12 pb-0">
          <div className="relative w-full h-52 sm:h-72 rounded-3xl overflow-hidden">
            {heroImage("w-full h-full object-cover")}
          </div>
        </div>
        <div className="container-wide py-10">
          <p className="text-xs font-semibold text-brand-300 mb-3">{eyebrow}</p>
          <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">{description}</p>
          <Buttons />
        </div>
      </div>
    );
  }

  /* ── 6. side-card ──────────────────────────────────────────────────────── */
  if (t === "side-card") {
    return (
      <div className="bg-slate-950 text-white">
        <div className="container-wide py-12 grid lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold text-brand-300 mb-3">{eyebrow}</p>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
            <p className="text-slate-300 leading-relaxed">{description}</p>
            <Buttons />
          </div>
          <div className="lg:col-span-2 relative h-56 lg:h-72 rounded-3xl overflow-hidden">
            {heroImage("w-full h-full object-cover")}
          </div>
        </div>
      </div>
    );
  }

  /* ── 7. grid-card ──────────────────────────────────────────────────────── */
  if (t === "grid-card") {
    return (
      <div className="bg-slate-950 text-white">
        <div className="container-wide py-12 grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold text-brand-300 mb-3">{eyebrow}</p>
            <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
            <p className="text-slate-300 leading-relaxed">{description}</p>
            <Buttons />
          </div>
          <div className="relative h-52 rounded-3xl overflow-hidden border border-white/10">
            {heroImage("w-full h-full object-cover")}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950/80 to-transparent">
              <span className="text-xs font-medium text-white/60">สาขาเทคโนโลยีคอมพิวเตอร์</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── 8. compact-banner ─────────────────────────────────────────────────── */
  if (t === "compact-banner") {
    return (
      <div className="bg-slate-950 text-white">
        <div className="relative w-full h-40 overflow-hidden">
          {heroImage("w-full h-full object-cover")}
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="absolute inset-0 flex items-center">
            <div className="container-wide">
              <p className="text-sm font-semibold text-brand-300">{eyebrow}</p>
            </div>
          </div>
        </div>
        <div className="container-wide py-10">
          <h1 className="text-3xl lg:text-4xl font-semibold leading-snug mb-3">{title}</h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">{description}</p>
          <Buttons />
        </div>
      </div>
    );
  }

  /* ── 9. poster-style ───────────────────────────────────────────────────── */
  if (t === "poster-style") {
    return (
      <div className="relative min-h-[58vh] flex items-end overflow-hidden">
        {heroImage("absolute inset-0 w-full h-full object-cover")}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="relative container-wide py-16 text-white">
          <p className="text-xs font-semibold text-brand-300 mb-3">{eyebrow}</p>
          <h1 className="text-4xl lg:text-5xl font-semibold leading-snug mb-3 max-w-2xl">{title}</h1>
          <p className="text-slate-300 max-w-xl leading-relaxed">{description}</p>
          <Buttons />
        </div>
      </div>
    );
  }

  /* ── 10. no-image-clean (default) ──────────────────────────────────────── */
  return (
    <div className="bg-slate-950 text-white">
      <div className="container-wide py-16 sm:py-20 lg:py-24">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 mb-5 text-xs font-medium text-brand-200">
          {eyebrow}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-snug mb-4 max-w-3xl">
          {title}
        </h1>
        <p className="text-slate-300 max-w-2xl leading-relaxed text-base lg:text-lg">
          {description}
        </p>
        <Buttons />
      </div>
    </div>
  );
}
