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
import { navigationItemsToMenuItems, type MenuItem } from "@/lib/navigationMenu";
import { fetchNavigationItems } from "@/frontend/api/navigation"; // 🛠️ นำเข้า API ดึงข้อมูลเมนู
import MobileMenu from "./MobileMenu";
import PublicLanguageToggle, { getPublicNavLabel, usePublicLanguage } from "./PublicLanguageToggle";

export default function Navbar({
  branding,
  menuItems,
}: {
  branding?: BrandingData;
  menuItems?: MenuItem[];
}) {
  const b = branding ?? DEFAULT_BRANDING;
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const language = usePublicLanguage();

  // 🛠️ เปลี่ยนการจัดการ State มารองรับข้อมูลไดนามิกจากหลังบ้าน
  const [items, setItems] = useState<MenuItem[]>(menuItems ?? []);
  const [loading, setLoading] = useState(!menuItems || menuItems.length === 0);

  // 🛠️ โหลดข้อมูลเมนูจากระบบฐานข้อมูลสดๆ ตอนเปิดหน้าเว็บ
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
      setItems(menuItems);
      setLoading(false);
      return;
    }

    async function loadNavbarData() {
      try {
        const data = await fetchNavigationItems();
        const formattedMenus = navigationItemsToMenuItems(data);
        setItems(formattedMenus);
      } catch (error) {
        console.error("ไม่สามารถโหลดเมนูหน้าบ้านจากฐานข้อมูลได้: ", error);
      } finally {
        setLoading(false);
      }
    }
    loadNavbarData();
  }, [menuItems]);

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

  // ช่วงที่กำลังดึงข้อมูลจาก DB ให้แสดงเป็นแถบ Navbar ว่างๆ เพื่อลดอาการ Layout Shift
  if (loading) {
    return <div className="h-16 w-full sticky top-0 z-[80] bg-[#020617] border-b border-white/5" />;
  }

  return (
    <>
      <header
        style={{ backgroundColor: "var(--color-navbar, #020617)" }}
        translate="no"
        className={cn(
          "notranslate site-navbar-shell sticky top-0 z-[80] overflow-visible transition-all duration-300",
          scrolled
            ? "border-b border-white/10 shadow-sm shadow-slate-950/30 backdrop-blur-md"
            : "border-b border-white/5 backdrop-blur-sm"
        )}
      >
        <div className="site-navbar-inner flex justify-between gap-3">
          {/* Logo */}
          <Link
            href="/"
            translate="no"
            className="notranslate site-navbar-logo-link group relative z-[55] flex min-w-0 max-w-[72vw] shrink items-center gap-2.5"
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
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-site-gradient shadow-site-primary lg:h-11 lg:w-11">
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
          <nav
            className={cn(
              "notranslate relative z-[70] hidden min-w-0 flex-1 items-center justify-end gap-1 lg:flex",
              isFreeLogo && "lg:ml-24 xl:ml-28"
            )}
            translate="no"
          >
            {items.map((item) => {
              const label = getPublicNavLabel({
                href: item.type === "link" ? item.href : null,
                label: item.label,
                labelEn: item.labelEn,
                language,
              });

              if (item.type === "link") {
                if (item.external) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      translate="no"
                      className="nav-underline notranslate flex items-center gap-1 rounded-full px-3.5 py-2 text-[length:var(--site-nav-font-size)] font-[var(--site-nav-font-weight)] text-slate-200 transition-colors hover:bg-white/5 hover-site-accent"
                    >
                      {label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    translate="no"
                    className={cn(
                      "nav-underline notranslate rounded-full px-3.5 py-2 text-[length:var(--site-nav-font-size)] font-[var(--site-nav-font-weight)] transition-colors",
                      isActive(item.href)
                        ? "active bg-white/[0.08] text-site-accent"
                        : "text-slate-200 hover:bg-white/5 hover-site-accent"
                    )}
                  >
                    {label}
                  </Link>
                );
              }

              const isDropdownActive = item.items.some(
                (sub: any) => !sub.external && isActive(sub.href)
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
                    translate="no"
                    className={cn(
                      "nav-underline notranslate flex items-center gap-1 rounded-full px-3.5 py-2 text-[length:var(--site-nav-font-size)] font-[var(--site-nav-font-weight)] transition-colors",
                      isDropdownActive || isOpen
                        ? "active bg-white/[0.08] text-site-accent"
                        : "text-slate-200 hover:bg-white/5 hover-site-accent"
                    )}
                  >
                    {label}
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
                    <div className="notranslate rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10" translate="no">
                      {item.items.map((sub: any) => {
                        const subLabel = getPublicNavLabel({
                          href: sub.href,
                          label: sub.label,
                          labelEn: sub.labelEn,
                          language,
                        });
                        const subDescription =
                          language === "en" ? sub.descriptionEn : sub.description;
                        if (sub.external) {
                          return (
                            <a
                              key={sub.href}
                              href={sub.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              translate="no"
                              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-colors hover-site-primary-soft"
                            >
                              <div>
                                <div className="font-medium">{subLabel}</div>
                                {subDescription && (
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {subDescription}
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
                            translate="no"
                            className={cn(
                              "block rounded-xl px-3 py-2.5 text-sm transition-colors",
                              isActive(sub.href)
                                ? "bg-site-primary-soft"
                                : "text-slate-700 hover-site-primary-soft"
                            )}
                          >
                            <div className="font-medium">{subLabel}</div>
                            {subDescription && (
                              <div className="mt-0.5 text-xs text-slate-500">
                                {subDescription}
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
            <PublicLanguageToggle className="hidden lg:inline-flex" />
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
        language={language}
      />
    </>
  );
}
