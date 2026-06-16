"use client";

import { usePathname } from "next/navigation";
import CroppedImage from "@/components/ui/CroppedImage";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import type { ImageCropSettings } from "@/lib/imageCrop";

export type PageHeroProps = {
  template?: string | null;
  imageUrl: string | null;
  imageAlt?: string | null;
  title: string;
  eyebrow: string;
  description: string;
  imageCropSettings?: ImageCropSettings | Record<string, unknown> | null;
  children?: React.ReactNode; 
};

// Full Path Mapping เพื่อระบุตัวตนของแต่ละหน้าเว็บแบบเจาะจง
const PATH_MAP: Record<string, string> = {
  "/about": "เกี่ยวกับสาขา",
  "/about/staff": "บุคลากร",
  "/about/laboratories": "อุปกรณ์การเรียนและห้องปฏิบัติการ",
  "/about/contact": "ติดต่อ",

  "/works": "ผลงาน",
  "/works/students": "ผลงานนักศึกษา",
  "/works/teachers": "ผลงานอาจารย์",

  "/students": "นักศึกษาปัจจุบัน",
  "/students-current": "นักศึกษาปัจจุบัน",
  "/students/registration": "ทะเบียนนักศึกษา",
  "/students/registrar": "งานทะเบียน",
  "/students/complaint": "ร้องเรียน / ความคิดเห็น",

  "/news": "ข่าวสาร",
  "/apply": "สมัครเรียน",
  "/programs": "หลักสูตร",
  "/programs/bachelor": "หลักสูตรปริญญาตรี",
  "/programs/master": "หลักสูตรปริญญาโท",
};

// 🛠️ กำหนด Path ที่ต้องการให้เป็นแค่ข้อความธรรมดา "ห้ามคลิก" (ป้องกันอาการหน้า 404)
const NON_CLICKABLE_PATHS = new Set([
  "/students",
  "/works",
  "/programs",
  "/about"
]);

export default function PageHero({
  template,
  imageUrl,
  imageAlt,
  title,
  eyebrow,
  description,
  imageCropSettings,
  children,
}: PageHeroProps) {
  
  const pathname = usePathname();
  const useNoImageLayout =
    !imageUrl || template === "no-image-clean" || template === "no-image";

  // ฟังก์ชันคำนวณและเจนอาร์เรย์ Breadcrumb ให้อัตโนมัติอย่างแม่นยำ
  const renderAutoBreadcrumb = () => {
    const breadcrumbItems: Array<{ label: string; href?: string }> = [
      { label: "หน้าแรก", href: "/" }
    ];

    const pathSegments = pathname.split("/").filter((segment) => segment !== "");
    let currentHref = "";

    pathSegments.forEach((segment, index) => {
      currentHref += `/${segment}`;
      
      const isLast = index === pathSegments.length - 1;
      const label = PATH_MAP[currentHref] || (isLast ? title : segment);

      const item: { label: string; href?: string } = {
        label: typeof label === "string" ? label : String(label)
      };

      // 🛠️ ตรรกะเช็ก: ถ้าไม่ใช่หน้าสุดท้าย และ Path นี้ไม่ได้ถูกสั่งห้ามคลิกไว้ -> ถึงจะใส่ลิงก์ href ให้กดได้
      if (!isLast && !NON_CLICKABLE_PATHS.has(currentHref)) {
        item.href = currentHref;
      }

      breadcrumbItems.push(item);
    });

    // กำหนดปุ่มย้อนกลับ (Back Button)
    const backHref = pathSegments.length > 1 
      ? `/${pathSegments.slice(0, -1).join("/")}` 
      : "/";

    return (
      <div className="sticky top-[72px] z-[70] border-b border-white/10 bg-slate-950/90 backdrop-blur-xl lg:top-[88px] w-full">
        <div className="container-wide flex min-w-0 justify-start py-3.5 px-4 sm:px-6 lg:px-8">
          <BreadcrumbTrail dark backHref={backHref} items={breadcrumbItems} />
        </div>
      </div>
    );
  };

  // ============================================================
  // ✨ รูปแบบที่ 1: กรณีไม่มีรูปภาพ
  // ============================================================
  if (useNoImageLayout) {
    return (
      <>
        {renderAutoBreadcrumb()}

        <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950 text-white min-h-[260px] flex items-center w-full">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.16),transparent_38%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] z-0" />
          <div className="border-site-gradient-line absolute inset-x-0 bottom-0 h-px z-10" />

          <div className="container-wide w-full relative z-10 py-12 px-4 sm:px-6 lg:px-8 text-left">
            <div className="max-w-4xl">
              {eyebrow && (
                <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[11px] sm:text-xs font-medium text-site-accent backdrop-blur">
                  {eyebrow}
                </div>
              )}
              
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
              
              {description && (
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 font-normal tracking-wide opacity-85 sm:text-base">
                  {description}
                </p>
              )}
              {children}
            </div>
          </div>
        </section>
      </>
    );
  }

  // ============================================================
  // ✨ รูปแบบที่ 2: กรณีมีรูปภาพพื้นหลัง
  // ============================================================
  return (
    <>
      {renderAutoBreadcrumb()}

      <section className="relative overflow-hidden border-b border-slate-900 bg-slate-950 text-white min-h-[260px] flex items-center w-full">
        <div className="absolute inset-0 z-0 w-full h-full">
          <CroppedImage
            src={imageUrl}
            alt={imageAlt || title}
            crop={imageCropSettings}
            className="h-full w-full object-cover object-center opacity-55 brightness-[0.85]"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.16),transparent_42%)] z-[1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/75 via-[#0f172a]/35 to-transparent z-[1]" />
        <div className="border-site-gradient-line absolute inset-x-0 bottom-0 h-px z-10" />

        <div className="container-wide w-full relative z-10 py-12 px-4 sm:px-6 lg:px-8 text-left">
          <div className="max-w-4xl">
            {eyebrow && (
              <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[11px] sm:text-xs font-medium text-site-accent backdrop-blur">
                {eyebrow}
              </div>
            )}
            
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            
            {description && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 font-normal tracking-wide opacity-85 sm:text-base">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
