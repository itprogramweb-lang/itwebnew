import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeLoader from "@/components/ThemeLoader";
import { getBranding } from "@/lib/branding";
import { DEFAULT_BRANDING } from "@/lib/brandingTypes";

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
  try {
    branding = await getBranding();
  } catch {
    // silent fallback — ใช้ DEFAULT_BRANDING
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
        <Navbar branding={branding} />
        <main className="flex-1">{children}</main>
        <Footer branding={branding} />
      </body>
    </html>
  );
}
