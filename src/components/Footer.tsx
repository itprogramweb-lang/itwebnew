"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Phone, MapPin, Clock } from "lucide-react";
import type { BrandingData } from "@/lib/brandingTypes";
import { DEFAULT_BRANDING } from "@/lib/brandingTypes";
import { buildLogoStyle } from "@/lib/logoPresets";
import { siteData } from "@/data/site";

export default function Footer({ branding }: { branding?: BrandingData }) {
  const b = branding ?? DEFAULT_BRANDING;
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname === "/login") return null;

const phone = siteData.phone;
const address = siteData.address;
const facebookUrl = siteData.facebook;
  const loanUrl = b.loanExternalUrl;
  const { wrapperStyle: logoWrapper, imgStyle: logoImgStyle } = buildLogoStyle({
    size: 44,
    preset: b.logoCropPreset,
    fitMode: b.logoFitMode,
    posX: b.logoPosX,
    posY: b.logoPosY,
    zoom: b.logoZoom,
  });

  return (
    <footer
      style={{ backgroundColor: "var(--color-footer, #0f172a)" }}
      className="relative mt-16 overflow-hidden text-slate-300"
    >
      <div className="border-site-gradient-line absolute inset-x-0 top-0 h-px" />

      <div className="container-wide relative py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="notranslate flex items-center gap-2.5 mb-4" translate="no">
              {b.showLogo && b.logoUrl ? (
                <div style={logoWrapper}>
                  <img src={b.logoUrl} alt={b.logoAlt} style={logoImgStyle} />
                </div>
              ) : b.showLogo ? (
                <div className="w-11 h-11 rounded-2xl bg-site-gradient grid place-items-center shadow-site-primary">
                  <span className="text-white font-bold text-sm select-none">
                    {b.brandShortName.slice(0, 2)}
                  </span>
                </div>
              ) : null}
              {b.showBrandName && (
                <div>
                  <div className="font-semibold text-white">{b.brandShortName}</div>
                  <div className="text-xs text-slate-400">{b.brandName}</div>
                </div>
              )}
            </div>
            <p className="notranslate text-sm leading-relaxed text-slate-300" translate="no">
              {b.departmentNameTh}
            </p>
            {facebookUrl && (
              <div className="flex gap-2 mt-5">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  translate="no"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-200 transition-colors hover:bg-white/15 hover-site-accent"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4">เมนูหลัก</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="hover-site-accent transition-colors">หน้าแรก</Link></li>
              <li><Link href="/apply" className="hover-site-accent transition-colors">สมัครเรียน</Link></li>
              <li><Link href="/news" className="hover-site-accent transition-colors">ข่าวสาร</Link></li>
              <li><Link href="/about" className="hover-site-accent transition-colors">เกี่ยวกับสาขา</Link></li>
              <li><Link href="/about/facilities" className="hover-site-accent transition-colors">อุปกรณ์การเรียนและห้องปฏิบัติการ</Link></li>
              <li><Link href="/programs/bachelor" className="hover-site-accent transition-colors">ปริญญาตรี</Link></li>
              <li><Link href="/programs/master" className="hover-site-accent transition-colors">ปริญญาโท</Link></li>
            </ul>
          </div>

          {/* For students */}
          <div>
            <h4 className="text-white font-semibold mb-4">สำหรับนักศึกษา</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/students/registration" className="hover-site-accent transition-colors">ทะเบียน</Link></li>
              <li>
                <a
                  href={loanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover-site-accent transition-colors"
                >
                  กยศ.
                </a>
              </li>
              <li><Link href="/students/welfare" className="hover-site-accent transition-colors">สวัสดิการ</Link></li>
              <li><Link href="/students/complaint" className="hover-site-accent transition-colors">ร้องเรียน/ความคิดเห็น</Link></li>
              <li><Link href="/works/students" className="hover-site-accent transition-colors">ผลงานนักศึกษา</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">ติดต่อสาขา</h4>
            <ul className="space-y-3 text-sm">
              {address && (
                <li className="notranslate flex gap-2.5" translate="no">
                  <MapPin className="w-4 h-4 mt-0.5 text-site-footer-accent shrink-0" />
                  <span className="leading-relaxed">{address}</span>
                </li>
              )}
              {phone && (
                <li className="notranslate flex items-center gap-2.5" translate="no">
                  <Phone className="w-4 h-4 text-site-footer-accent shrink-0" />
                  <span>{phone}</span>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-site-footer-accent shrink-0" />
                <span>{siteData.workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
          <p className="notranslate leading-relaxed" translate="no">
            © {new Date().getFullYear()} {b.departmentNameTh} •{" "}
            {b.universityNameTh}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-500 transition-colors hover:text-slate-300">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
