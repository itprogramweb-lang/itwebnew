"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Menu, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildNavbarLogoStyle } from "@/lib/logoPresets";
import type { BrandingData } from "@/lib/brandingTypes";
import { DEFAULT_BRANDING } from "@/lib/brandingTypes";
import MobileMenu from "./MobileMenu";

export type MenuItem =
  | {
      type: "link";
      label: string;
      href: string;
      external?: boolean;
    }
  | {
      type: "dropdown";
      label: string;
      items: {
        label: string;
        href: string;
        description?: string;
        external?: boolean;
      }[];
    };


function buildMenuItems(loanUrl: string, welfareUrl: string): MenuItem[] {
  return [
    {
      type: "link",
      label: "หน้าแรก",
      href: "/",
    },
    {
      type: "link",
      label: "สมัครเรียน",
      href: "/apply",
    },
    {
      type: "link",
      label: "ข่าวสาร",
      href: "/news",
    },
    
{
  type: "dropdown",
  label: "เกี่ยวกับสาขา",
  items: [
    {
      label: "เกี่ยวกับสาขา",
      href: "/about",
      description: "วิสัยทัศน์ พันธกิจ และจุดเด่น",
    },
    {
      label: "บุคลากร",
      href: "/about/staff",
      description: "อาจารย์และเจ้าหน้าที่",
    },
    {
      label: "อุปกรณ์การเรียนและห้องปฏิบัติการ",
      href: "/about/facilities",
      description: "ห้องเรียน ห้องปฏิบัติการ และอุปกรณ์สนับสนุนการเรียน",
    },
    {
      label: "ติดต่อ",
      href: "/about/contact",
      description: "ที่อยู่ และแผนที่",
    },
  ],
},
    {
      type: "dropdown",
      label: "หลักสูตร",
      items: [
        {
          label: "ปริญญาตรี",
          href: "/programs/bachelor",
          description: "หลักสูตร 4 ปี",
        },
        {
          label: "ปริญญาโท",
          href: "/programs/master",
          description: "หลักสูตร 2 ปี",
        },
      ],
    },
    {
      type: "dropdown",
      label: "ผลงาน",
      items: [
        {
          label: "ผลงานนักศึกษา",
          href: "/works/students",
          description: "ปริญญานิพนธ์ (Thesis) และรางวัล",
        },
        {
          label: "ผลงานอาจารย์",
          href: "/works/teachers",
          description: "งานวิจัยและบทความ",
        },
      ],
    },
    {
      type: "dropdown",
      label: "นักศึกษาปัจจุบัน",
      items: [
        {
          label: "ทะเบียน",
          href: "/students/registration",
        },
        {
          label: "กยศ.",
          href: loanUrl,
          external: true,
        },
        {
          label: "สวัสดิการ",
          href: welfareUrl,
          external: true,
        },
        {
          label: "ร้องเรียน/ความคิดเห็น",
          href: "/students/complaint",
        },
      ],
    },
  ];
}

// static export for backward compatibility
export const menuItems: MenuItem[] = buildMenuItems(
  DEFAULT_BRANDING.loanExternalUrl,
  DEFAULT_BRANDING.welfareExternalUrl
);

export default function Navbar({ branding }: { branding?: BrandingData }) {
  const b = branding ?? DEFAULT_BRANDING;
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

const items = buildMenuItems(
  b.loanExternalUrl,
  b.welfareExternalUrl
);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  if (pathname.startsWith("/dashboard") || pathname === "/login") {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navbarLogoBase = {
    logoDesktopSize: b.logoDesktopSize,
    logoMobileSize: b.logoMobileSize,
    preset: b.logoCropPreset,
    fitMode: b.logoFitMode,
    posX: b.logoPosX,
    posY: b.logoPosY,
    zoom: b.logoZoom,
    displayMode: b.logoNavbarDisplayMode,
    visualSizeDesktop: b.logoNavbarVisualSizeDesktop,
    visualSizeMobile: b.logoNavbarVisualSizeMobile,
    offsetX: b.logoNavbarOffsetX,
    offsetY: b.logoNavbarOffsetY,
    zIndex: b.logoNavbarZIndex,
    overflow: b.logoNavbarOverflow,
  };

  const desktopLogo = buildNavbarLogoStyle({
    ...navbarLogoBase,
    viewport: "desktop",
  });

  const mobileLogo = buildNavbarLogoStyle({
    ...navbarLogoBase,
    viewport: "mobile",
  });

  const isFreeLogo = desktopLogo.isFree;
  const logoSlotStyle = desktopLogo.slotStyle;

  const logoLayerClass = isFreeLogo
    ? "site-navbar-logo-free"
    : "transition-transform group-hover:scale-105";

  const logoLayerStyle: CSSProperties | undefined = isFreeLogo
    ? desktopLogo.layerStyle
    : undefined;

  return (
    <>
      <header
        style={{ backgroundColor: "var(--color-navbar, #020617)" }}
        className={cn(
          "site-navbar-shell sticky top-0 z-[80] overflow-visible transition-all duration-300",
          scrolled
            ? "border-b border-white/10 shadow-sm shadow-slate-950/30 backdrop-blur-md"
            : "border-b border-white/5 backdrop-blur-sm"
        )}
      >
        <div className="site-navbar-inner flex justify-between gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="site-navbar-logo-link group relative z-[55] flex min-w-0 max-w-[72vw] shrink items-center gap-2.5"
          >
            <div
              className="site-navbar-logo-slot shrink-0"
              style={logoSlotStyle}
            >
              <div className={logoLayerClass} style={logoLayerStyle}>
                {b.showLogo && b.logoUrl ? (
                  <>
                    <div className="lg:hidden" style={mobileLogo.wrapperStyle}>
                      <img
                        src={b.logoUrl}
                        alt={b.logoAlt}
                        style={mobileLogo.imgStyle}
                      />
                    </div>

                    <div
                      className="hidden lg:block"
                      style={desktopLogo.wrapperStyle}
                    >
                      <img
                        src={b.logoUrl}
                        alt={b.logoAlt}
                        style={desktopLogo.imgStyle}
                      />
                    </div>
                  </>
                ) : b.showLogo ? (
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-gradient shadow-sm shadow-orange-900/30 lg:h-11 lg:w-11">
                    <span className="select-none text-sm font-bold text-white lg:text-base">
                      {b.brandShortName.slice(0, 2)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {b.showBrandName && (
              <div className="min-w-0 max-w-[42vw] leading-tight lg:max-w-[240px]">
                <div className="truncate text-sm font-semibold text-white lg:text-base">
                  {b.brandShortName}
                </div>
                <div className="hidden max-w-[220px] truncate text-[10px] text-slate-300 sm:block lg:text-xs">
                  {b.brandName}
                </div>
              </div>
            )}
          </Link>

          {/* Desktop menu */}
          <nav className="relative z-[70] hidden items-center gap-1 lg:flex">
            {items.map((item) => {
              if (item.type === "link") {
                if (item.external) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-underline flex items-center gap-1 rounded-full px-3.5 py-2 text-[length:var(--site-nav-font-size)] font-[var(--site-nav-font-weight)] text-slate-200 transition-colors hover:bg-white/5 hover:text-brand-200"
                    >
                      {item.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "nav-underline rounded-full px-3.5 py-2 text-[length:var(--site-nav-font-size)] font-[var(--site-nav-font-weight)] transition-colors",
                      isActive(item.href)
                        ? "active bg-white/[0.08] text-brand-200"
                        : "text-slate-200 hover:bg-white/5 hover:text-brand-200"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }

              const isDropdownActive = item.items.some(
                (sub) => !sub.external && isActive(sub.href)
              );

              const isOpen = openDropdown === item.label;

              return (
                <div
                  key={item.label}
                  className="site-navbar-nav-item relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    className={cn(
                      "nav-underline flex items-center gap-1 rounded-full px-3.5 py-2 text-[length:var(--site-nav-font-size)] font-[var(--site-nav-font-weight)] transition-colors",
                      isDropdownActive || isOpen
                        ? "active bg-white/[0.08] text-brand-200"
                        : "text-slate-200 hover:bg-white/5 hover:text-brand-200"
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "site-navbar-dropdown-layer absolute left-0 top-full min-w-[280px] pt-3 transition-all",
                      isOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-1 opacity-0"
                    )}
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
                      {item.items.map((sub) => {
                        if (sub.external) {
                          return (
                            <a
                              key={sub.href}
                              href={sub.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600"
                            >
                              <div>
                                <div className="font-medium">{sub.label}</div>
                                {sub.description && (
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {sub.description}
                                  </div>
                                )}
                              </div>

                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={cn(
                              "block rounded-xl px-3 py-2.5 text-sm transition-colors",
                              isActive(sub.href)
                                ? "bg-brand-50 text-brand-600"
                                : "text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                            )}
                          >
                            <div className="font-medium">{sub.label}</div>
                            {sub.description && (
                              <div className="mt-0.5 text-xs text-slate-500">
                                {sub.description}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-100 hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={items}
        activePath={pathname}
      />
    </>
  );
}
