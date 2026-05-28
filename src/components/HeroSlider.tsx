"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSlideRow, SiteSettingsRow } from "@/lib/supabase/queries";
import CroppedImage from "@/components/ui/CroppedImage";

const FALLBACK_IMAGE = "/placeholders/hero-1.svg";

type SlideSettings = {
  showTitle?: boolean;
  showSubtitle?: boolean;
  showDescription?: boolean;
  showRightItems?: boolean;
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;
  textPosition?: "left" | "center" | "right";
  verticalPosition?: "top" | "center" | "bottom";
  textAlign?: "left" | "center" | "right";
  imagePosition?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  gradientDirection?: string;
  slideDuration?: number;
  titleSize?: "small" | "medium" | "large" | "xl";
  contentMaxWidth?: "md" | "lg" | "xl" | "2xl";
};

function parseSettings(raw: Record<string, unknown>): SlideSettings {
  return raw as SlideSettings;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(0,0,0,${alpha})`;
  }

  return `rgba(${r},${g},${b},${alpha})`;
}

function clampOverlayOpacity(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0.02;
  return Math.min(0.45, Math.max(0.05, value));
}

function getOverlayStyle(s: SlideSettings): CSSProperties {
  const overlayColor = s.overlayColor || "#000000";
  const opacity = clampOverlayOpacity(s.overlayOpacity);
  const solid = hexToRgba(overlayColor, opacity);

  if (s.gradientDirection) {
    const transparent = hexToRgba(overlayColor, 0);

    return {
      background: `linear-gradient(${s.gradientDirection}, ${solid} 0%, ${solid} 42%, ${transparent} 100%)`,
    };
  }

  return { backgroundColor: solid };
}

function getReadabilityOverlayStyle(
  textPosition: SlideSettings["textPosition"]
): CSSProperties {
  if (textPosition === "right") {
    return {
      background:
        "linear-gradient(to left, rgba(0,0,0,0.28), rgba(0,0,0,0.12), transparent)",
    };
  }

  if (textPosition === "center") {
    return {
      background:
        "radial-gradient(circle at center, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.1) 38%, transparent 72%)",
    };
  }

  return {
    background:
      "linear-gradient(to right, rgba(0,0,0,0.28), rgba(0,0,0,0.12), transparent)",
  };
}
const TITLE_SIZES: Record<string, string> = {
  small: "text-2xl sm:text-3xl lg:text-4xl",
  medium: "text-2xl sm:text-4xl lg:text-5xl",
  large: "text-2xl sm:text-4xl lg:text-5xl",
  xl: "text-3xl sm:text-5xl lg:text-6xl",
};

const CONTENT_WIDTHS: Record<string, string> = {
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
};

const VERTICAL_CLASSES: Record<string, string> = {
  top: "items-start pt-10 pb-12 sm:pt-16 sm:pb-16 lg:pt-28",
  center: "items-center py-8 sm:py-12 lg:py-24",
  bottom: "items-end pb-12 pt-10 sm:pb-16 sm:pt-16 lg:pb-28",
};

const TEXT_ALIGN_CLASSES: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const CONTENT_POS_CLASSES: Record<string, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
};

const FLEX_JUSTIFY_CLASSES: Record<string, string> = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

export default function HeroSlider({
  slides,
  siteSettings,
}: {
  slides: HeroSlideRow[];
  siteSettings: SiteSettingsRow | null;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const currentSlide = slides[active] ?? null;
  const s = parseSettings(currentSlide?.settings ?? {});
  const slideDuration = s.slideDuration ?? 5000;

  const goTo = (index: number) => {
    setActive((index + slides.length) % slides.length);
  };

  const goPrev = () => {
    goTo(active - 1);
  };

  const goNext = () => {
    goTo(active + 1);
  };

  useEffect(() => {
    if (paused || slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, slideDuration);

    return () => window.clearInterval(timer);
  }, [paused, slides.length, active, slideDuration]);

  useEffect(() => {
    if (slides.length > 0 && active >= slides.length) {
      setActive(0);
    }
  }, [active, slides.length]);

  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(249,115,22,0.22),transparent_38%),linear-gradient(120deg,#020617_0%,#0f172a_60%,#7c2d12_100%)]" />

        <div className="container-wide relative flex min-h-[480px] items-center py-16">
          <div className="max-w-xl">
            {siteSettings?.faculty_name && (
              <div className="mb-5 inline-flex items-center rounded-full border border-orange-400/30 bg-orange-500/15 px-3.5 py-1.5 text-xs font-semibold text-orange-200">
                {siteSettings.faculty_name}
              </div>
            )}

            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {siteSettings?.site_name ?? "สาขาเทคโนโลยีสารสนเทศ"}
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-200">
              ยังไม่มีข้อมูลสไลด์ในขณะนี้
            </p>
          </div>
        </div>
      </section>
    );
  }

  const showTitle = s.showTitle ?? true;
  const showSubtitle = s.showSubtitle ?? true;
  const showDescription = s.showDescription ?? true;
  const showRightItems = s.showRightItems ?? true;
  const showPrimaryButton = s.showPrimaryButton ?? true;
  const showSecondaryButton = s.showSecondaryButton ?? true;

  const textPos = s.textPosition ?? "left";
  const verticalPos = s.verticalPosition ?? "center";
  const textAlign = s.textAlign ?? "left";

  const titleClass = TITLE_SIZES[s.titleSize ?? "large"] ?? TITLE_SIZES.large;
  const maxWidthClass =
    CONTENT_WIDTHS[s.contentMaxWidth ?? "xl"] ?? CONTENT_WIDTHS.xl;
  const verticalClass =
    VERTICAL_CLASSES[verticalPos] ?? VERTICAL_CLASSES.center;
  const textAlignClass =
    TEXT_ALIGN_CLASSES[textAlign] ?? TEXT_ALIGN_CLASSES.left;
  const contentPosClass =
    CONTENT_POS_CLASSES[textPos] ?? CONTENT_POS_CLASSES.left;
  const flexJustify =
    FLEX_JUSTIFY_CLASSES[textPos] ?? FLEX_JUSTIFY_CLASSES.left;

  const rightItems = Array.isArray(currentSlide.right_items)
    ? currentSlide.right_items.filter((x): x is string => typeof x === "string")
    : [];

  const hasPrimaryBtn =
    showPrimaryButton &&
    !!currentSlide.primary_button_text &&
    !!currentSlide.primary_button_url;

  const hasSecondaryBtn =
    showSecondaryButton &&
    !!currentSlide.secondary_button_text &&
    !!currentSlide.secondary_button_url;

  return (
    <section
      className="relative overflow-hidden bg-slate-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] min-h-[240px] sm:min-h-[320px] lg:aspect-auto lg:min-h-[680px]">
        {/* Slide backgrounds */}
        {slides.map((slide, index) => {
          const ss = parseSettings(slide.settings ?? {});
          const overlayStyle = getOverlayStyle(ss);
          const readabilityOverlayStyle = getReadabilityOverlayStyle(
            ss.textPosition ?? "left"
          );
          const imgPos = ss.imagePosition ?? "center";

          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                index === active
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              )}
              aria-hidden={index !== active}
            >
              <CroppedImage
                src={slide.image_url || FALLBACK_IMAGE}
                fallbackSrc={FALLBACK_IMAGE}
                alt={slide.image_alt || slide.title}
                crop={{
                  ...(slide.image_crop_settings ?? {}),
                  fitMode: "contain",
                  posX: 50,
                  posY: 50,
                  frameShape: "banner",
                }}
                className="absolute inset-0 h-full w-full rounded-none bg-slate-950 lg:hidden"
              />
              <CroppedImage
                src={slide.image_url || FALLBACK_IMAGE}
                fallbackSrc={FALLBACK_IMAGE}
                alt={slide.image_alt || slide.title}
                crop={{
                  ...(slide.image_crop_settings ?? {}),
                  posX:
                    slide.image_crop_settings?.posX ??
                    (imgPos === "left" ? 0 : imgPos === "right" ? 100 : 50),
                  posY:
                    slide.image_crop_settings?.posY ??
                    (imgPos === "top" ? 0 : imgPos === "bottom" ? 100 : 50),
                  frameShape: "banner",
                }}
                className="absolute inset-0 hidden h-full w-full rounded-none lg:block"
              />

              <div className="absolute inset-0" style={overlayStyle} />
              <div
                className="absolute inset-0"
                style={readabilityOverlayStyle}
              />
            </div>
          );
        })}

        {/* Content layer */}
        <div
          className={cn(
            "container-wide relative z-10 flex min-h-[240px] sm:min-h-[320px] lg:min-h-[680px]",
            verticalClass
          )}
        >
          <div
            className={cn(
              "w-full text-white",
              maxWidthClass,
              contentPosClass,
              textAlignClass
            )}
          >
            {showSubtitle && currentSlide.subtitle && (
              <div className="text-shadow-soft inline-flex items-center rounded-full border border-orange-300/25 bg-orange-500/15 px-3.5 py-1.5 text-xs font-medium text-orange-100 backdrop-blur-sm">
                {currentSlide.subtitle}
              </div>
            )}

            {showTitle && (
              <h1
                className={cn(
                  "text-shadow-soft font-semibold leading-[1.12] text-white",
                  titleClass,
                  showSubtitle && currentSlide.subtitle ? "mt-4" : ""
                )}
              >
                {currentSlide.title}
              </h1>
            )}

            {showDescription && currentSlide.description && (
              <p className="text-shadow-soft mt-4 text-base leading-relaxed text-white/90 sm:text-lg">
                {currentSlide.description}
              </p>
            )}

            {showRightItems && rightItems.length > 0 && (
              <div className={cn("mt-4 flex flex-wrap gap-2", flexJustify)}>
                {rightItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            {(hasPrimaryBtn || hasSecondaryBtn) && (
              <div className={cn("mt-7 flex flex-wrap gap-3", flexJustify)}>
                {hasPrimaryBtn && (
                  <Link
                    href={currentSlide.primary_button_url!}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-950/30 transition-all hover:bg-orange-400 active:scale-[0.97] sm:h-12 sm:w-auto sm:px-6"
                  >
                    {currentSlide.primary_button_text}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                {hasSecondaryBtn && (
                  <Link
                    href={currentSlide.secondary_button_url!}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.97] sm:h-12 sm:w-auto sm:px-6"
                  >
                    {currentSlide.secondary_button_text}
                  </Link>
                )}
              </div>
            )}

            {/* {(siteSettings?.site_name || siteSettings?.university_name) && (
              <div className="text-shadow-soft mt-8 text-sm font-normal normal-case leading-relaxed tracking-normal text-white/75 md:whitespace-nowrap md:text-base">
                {[siteSettings?.site_name, siteSettings?.university_name]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )} */}
          </div>
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-[10%] top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-950/35 text-white backdrop-blur-sm transition hover:bg-slate-950/55 active:scale-95 sm:left-[10%] sm:h-9 sm:w-9 md:left-[8%] md:h-10 md:w-10 lg:left-10 lg:h-12 lg:w-12"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute right-[15%] top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-950/35 text-white backdrop-blur-sm transition hover:bg-slate-950/55 active:scale-95 sm:right-[10%] sm:h-9 sm:w-9 md:right-[8%] md:h-10 md:w-10 lg:right-10 lg:h-12 lg:w-12"
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-7 lg:w-7" />
            </button>
          </>
        )}

        {/* Navigation dots */}
        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center sm:bottom-5">
            <div className="flex items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    active === index
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/50 hover:bg-white/80"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom fade to page background */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950 to-transparent sm:h-16 lg:h-24" />
      </div>
    </section>
  );
}
