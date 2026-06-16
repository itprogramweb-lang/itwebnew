"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Phone, MapPin, Clock } from "lucide-react";
import type { BrandingData } from "@/lib/brandingTypes";
import { DEFAULT_BRANDING } from "@/lib/brandingTypes";
import { buildLogoStyle } from "@/lib/logoPresets";
import type { MenuItem } from "@/lib/navigationMenu";
import { getPublicNavLabel, usePublicLanguage } from "./PublicLanguageToggle";
import type { NavigationItem } from "@/types";

type FooterLink = {
  label: string;
  labelEn?: string;
  href: string;
  external?: boolean;
};

type FooterContact = {
  label: string;
  href?: string | null;
};

const fallbackMainLinks: FooterLink[] = [
  { label: "หน้าแรก", labelEn: "Home", href: "/" },
  { label: "สมัครเรียน", labelEn: "Admissions", href: "/apply" },
  { label: "ข่าวสาร", labelEn: "News", href: "/news" },
  { label: "เกี่ยวกับสาขา", labelEn: "About the Department", href: "/about" },
  { label: "อุปกรณ์การเรียนและห้องปฏิบัติการ", labelEn: "Facilities and Laboratories", href: "/about/facilities" },
  { label: "ปริญญาตรี", labelEn: "Undergraduate Program", href: "/programs/bachelor" },
  { label: "ปริญญาโท", labelEn: "Graduate Program", href: "/programs/master" },
];

function fallbackStudentLinks(loanUrl: string): FooterLink[] {
  return [
    { label: "ทะเบียน", labelEn: "Registration", href: "/students/registration" },
    { label: "กยศ.", labelEn: "Student Loan Fund", href: loanUrl, external: true },
    { label: "สวัสดิการ", labelEn: "Student Welfare", href: "/students/welfare" },
    { label: "ร้องเรียน/ความคิดเห็น", labelEn: "Complaints and Feedback", href: "/students/complaint" },
    { label: "ผลงานนักศึกษา", labelEn: "Student Works", href: "/works/students" },
  ];
}

function flattenFooterLinks(items?: MenuItem[]): FooterLink[] {
  if (!items?.length) return [];
  return items.flatMap((item) => {
    if (item.type === "link") {
      return [{
        label: item.label,
        labelEn: item.labelEn,
        href: item.href,
        external: item.external,
      }];
    }
    return item.items.map((child) => ({
      label: child.label,
      labelEn: child.labelEn,
      href: child.href,
      external: child.external,
    }));
  });
}

function FooterLinkList({ links }: { links: FooterLink[] }) {
  const language = usePublicLanguage();

  if (links.length === 0) {
    return <p className="text-sm text-slate-400">ยังไม่มีรายการเมนู</p>;
  }

  return (
    <ul className="space-y-2.5 text-sm">
      {links.map((item) => {
        const label = getPublicNavLabel({
          href: item.href,
          label: item.label,
          labelEn: item.labelEn,
          language,
        });

        if (item.external) {
          return (
            <li key={`${item.href}:${item.label}`}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="notranslate hover-site-accent transition-colors"
              >
                {label}
              </a>
            </li>
          );
        }

        return (
          <li key={`${item.href}:${item.label}`}>
            <Link
              href={item.href}
              translate="no"
              className="notranslate hover-site-accent transition-colors"
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ContactValue({
  item,
  className,
}: {
  item: FooterContact;
  className?: string;
}) {
  const href = item.href?.trim();
  if (!href) return <span className={className}>{item.label}</span>;

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} translate="no" className={`notranslate hover-site-accent transition-colors ${className ?? ""}`}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target={/^https?:\/\//i.test(href) ? "_blank" : undefined}
      rel={/^https?:\/\//i.test(href) ? "noopener noreferrer" : undefined}
      translate="no"
      className={`notranslate hover-site-accent transition-colors ${className ?? ""}`}
    >
      {item.label}
    </a>
  );
}

function FooterContactList({ items }: { items: FooterContact[] }) {
  const icons = [
    <MapPin key="address" className="w-4 h-4 mt-0.5 text-site-footer-accent shrink-0" />,
    <Phone key="phone" className="w-4 h-4 text-site-footer-accent shrink-0" />,
    <Clock key="hours" className="w-4 h-4 text-site-footer-accent shrink-0" />,
  ];

  return (
    <ul className="space-y-3 text-sm">
      {items.map((item, index) => (
        <li
          key={`${item.label}:${index}`}
          className={`notranslate flex gap-2.5 ${index === 1 ? "items-center" : ""}`}
          translate="no"
        >
          {icons[index] ?? <MapPin className="w-4 h-4 mt-0.5 text-site-footer-accent shrink-0" />}
          <ContactValue item={item} className={index === 0 ? "leading-relaxed" : undefined} />
        </li>
      ))}
    </ul>
  );
}

export default function Footer({
  branding,
  mainLinks,
  studentLinks,
  contactItems,
}: {
  branding?: BrandingData;
  mainLinks?: MenuItem[];
  studentLinks?: MenuItem[];
  contactItems?: NavigationItem[];
}) {
const b = branding ?? DEFAULT_BRANDING;
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard") || pathname === "/login") return null;

  const facebookUrl = b.facebookUrl;
  const loanUrl = b.loanExternalUrl;
  const footerMainLinks = flattenFooterLinks(mainLinks);
  const footerStudentLinks = flattenFooterLinks(studentLinks);
  const footerContactItems = contactItems?.map((item) => ({
    label: item.label,
    href: item.href,
  })) ?? [];
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
            <FooterLinkList links={footerMainLinks.length > 0 ? footerMainLinks : fallbackMainLinks} />
          </div>

          {/* For students */}
          <div>
            <h4 className="text-white font-semibold mb-4">สำหรับนักศึกษา</h4>
            <FooterLinkList
              links={footerStudentLinks.length > 0 ? footerStudentLinks : fallbackStudentLinks(loanUrl)}
            />
          </div>

          {footerContactItems.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-4">ติดต่อสาขา</h4>
              <FooterContactList items={footerContactItems} />
            </div>
          )}
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
