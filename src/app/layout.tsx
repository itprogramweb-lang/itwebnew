import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeLoader from "@/components/ThemeLoader";
import PublicAutoTranslateProvider from "@/components/PublicAutoTranslateProvider";
import { getPublicNavigationItems } from "@/backend/services/navigation";
import { getBranding } from "@/lib/branding";
import { DEFAULT_BRANDING } from "@/lib/brandingTypes";
import { navigationItemsToMenuItems, type MenuItem } from "@/lib/navigationMenu";
import type { NavigationItem } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  let branding = DEFAULT_BRANDING;
  try {
    branding = await getBranding();
  } catch {
    // silent fallback
  }
  return {
    title: {
      default: `${branding.departmentNameTh} | ${branding.universityNameTh}`,
      template: `%s | ${branding.departmentNameTh}`,
    },
    description: `เรียน ${branding.departmentNameEn} แบบลงมือจริง พร้อมก้าวสู่โลกดิจิทัล`,
    keywords: [
      "RMUTT",
      "มทร.ธัญบุรี",
      branding.departmentNameTh,
      branding.departmentNameEn,
      branding.brandShortName,
    ],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let branding = DEFAULT_BRANDING;
  let navbarMenuItems: MenuItem[] | undefined;
  let footerMainMenuItems: MenuItem[] | undefined;
  let footerStudentMenuItems: MenuItem[] | undefined;
  let footerContactItems: NavigationItem[] | undefined;
  try {
    branding = await getBranding();
  } catch {
    // silent fallback — ใช้ DEFAULT_BRANDING
  }

  try {
    const navigationItems = await getPublicNavigationItems("navbar");
    const convertedItems = navigationItemsToMenuItems(navigationItems);
    if (convertedItems.length > 0) {
      navbarMenuItems = convertedItems;
    }
  } catch {
    console.warn("Failed to load dynamic navigation, using fallback.");
  }

  try {
    const [footerMainItems, footerStudentItems, contactItems] = await Promise.all([
      getPublicNavigationItems("footer_main"),
      getPublicNavigationItems("footer_students"),
      getPublicNavigationItems("footer_contact"),
    ]);
    const convertedMainItems = navigationItemsToMenuItems(footerMainItems, {
      locations: ["footer_main", "both"],
    });
    const convertedStudentItems = navigationItemsToMenuItems(footerStudentItems, {
      locations: ["footer_students", "both"],
    });
    if (convertedMainItems.length > 0) footerMainMenuItems = convertedMainItems;
    if (convertedStudentItems.length > 0) footerStudentMenuItems = convertedStudentItems;
    footerContactItems = contactItems.filter((item) => item.location === "footer_contact");
  } catch {
    // ใช้ fallback footer เดิมเมื่อโหลดเมนูจากฐานข้อมูลไม่ได้
  }

  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <ThemeLoader />
        <PublicAutoTranslateProvider />
        <Navbar branding={branding} menuItems={navbarMenuItems} />
        <main className="flex-1">{children}</main>
        <Footer
          branding={branding}
          mainLinks={footerMainMenuItems}
          studentLinks={footerStudentMenuItems}
          contactItems={footerContactItems}
        />
      </body>
    </html>
  );
}
