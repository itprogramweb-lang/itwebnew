import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, FileWarning } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { PageHeader } from "@/components/ui/primitives";
import { isAllowedPdfPath, resolveStudentWorkPdfUrl } from "./pdfLinks";

type Props = {
  searchParams: {
    file?: string;
    title?: string;
    filename?: string;
    returnTo?: string;
    returnLabel?: string;
    source?: string;
  };
};

type PdfBackSource = "student" | "teacher" | "course" | "final_project";

type PdfBackContext = {
  href: string;
  label: string;
  source: PdfBackSource;
};

function isSafeInternalReturnPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("://") && !value.includes("\\");
}

function isPdfBackSource(source: string | undefined): source is PdfBackSource {
  return source === "student" || source === "teacher" || source === "course" || source === "final_project";
}

function getDefaultBackLabel(source: PdfBackSource | undefined) {
  if (source === "teacher") return "กลับไปผลงานอาจารย์";
  if (source === "course") return "กลับไปผลงานรายวิชา";
  if (source === "final_project") return "กลับไปปริญญานิพนธ์ (Thesis)";
  return "กลับไปผลงานนักศึกษา";
}

function getPathFromPdfFile(file: string) {
  try {
    const decoded = decodeURIComponent(file);
    if (/^https?:\/\//i.test(decoded)) return new URL(decoded).pathname;
    return decoded;
  } catch {
    return file;
  }
}

function inferBackContextFromFile(file: string) {
  const path = getPathFromPdfFile(file);
  const lowerPath = path.toLowerCase();

  if (lowerPath.includes("/teacher-works/")) {
    return { href: "/works/teachers", label: "กลับไปผลงานอาจารย์", source: "teacher" as const };
  }

  const courseMatch = path.match(/\/course\/([^/]+)\/([^/]+)(?:\/|$)/i);
  if (courseMatch) {
    const courseId = encodeURIComponent(courseMatch[1]);
    const year = encodeURIComponent(courseMatch[2]);
    return {
      href: `/works/students/course/${courseId}/${year}`,
      label: "กลับไปผลงานรายวิชา",
      source: "course" as const,
    };
  }

  const finalProjectMatch = path.match(/\/(?:final-projects|final_project)\/([^/]+)(?:\/|$)/i);
  if (finalProjectMatch) {
    const year = encodeURIComponent(finalProjectMatch[1]);
    return {
      href: `/works/students/final-projects/${year}`,
      label: "กลับไปปริญญานิพนธ์ (Thesis)",
      source: "final_project" as const,
    };
  }

  return null;
}

function getSafePdfBackContext(params: Props["searchParams"]): PdfBackContext {
  const returnTo = params.returnTo?.trim() ?? "";
  const returnLabel = params.returnLabel?.trim() ?? "";
  const source = params.source?.trim();
  const safeSource = isPdfBackSource(source) ? source : undefined;
  const file = params.file?.trim() ?? "";

  if (isSafeInternalReturnPath(returnTo)) {
    const inferredContext = inferBackContextFromFile(file);
    const contextSource = safeSource ?? inferredContext?.source ?? "student";
    return {
      href: returnTo,
      label: returnLabel || getDefaultBackLabel(contextSource),
      source: contextSource,
    };
  }

  if (safeSource === "teacher") {
    return { href: "/works/teachers", label: getDefaultBackLabel(safeSource), source: safeSource };
  }

  if (safeSource === "course") {
    return inferBackContextFromFile(file) ?? {
      href: "/works/students/course",
      label: getDefaultBackLabel(safeSource),
      source: safeSource,
    };
  }

  if (safeSource === "final_project") {
    return inferBackContextFromFile(file) ?? {
      href: "/works/students/final-projects",
      label: getDefaultBackLabel(safeSource),
      source: safeSource,
    };
  }

  if (safeSource === "student") {
    return { href: "/works/students", label: getDefaultBackLabel(safeSource), source: safeSource };
  }

  return inferBackContextFromFile(file) ?? {
    href: "/works/students",
    label: "กลับไปผลงานนักศึกษา",
    source: "student",
  };
}

function getPdfBreadcrumbItems(context: PdfBackContext) {
  if (context.source === "teacher") {
    return [
      { label: "หน้าแรก", href: "/" },
      { label: "ผลงาน" },
      { label: "ผลงานอาจารย์", href: "/works/teachers" },
      { label: "ดูไฟล์ PDF" },
    ];
  }

  if (context.source === "course") {
    return [
      { label: "หน้าแรก", href: "/" },
      { label: "ผลงาน" },
      { label: "ผลงานนักศึกษา", href: "/works/students" },
      { label: "ผลงานรายวิชา", href: "/works/students/course" },
      { label: "ดูไฟล์ PDF" },
    ];
  }

  if (context.source === "final_project") {
    return [
      { label: "หน้าแรก", href: "/" },
      { label: "ผลงาน" },
      { label: "ผลงานนักศึกษา", href: "/works/students" },
      { label: "ปริญญานิพนธ์ (Thesis)", href: "/works/students/final-projects" },
      { label: "ดูไฟล์ PDF" },
    ];
  }

  return [
    { label: "หน้าแรก", href: "/" },
    { label: "ผลงาน" },
    { label: "ผลงานนักศึกษา", href: "/works/students" },
    { label: "ดูไฟล์ PDF" },
  ];
}

export default function StudentWorkPdfViewerPage({ searchParams }: Props) {
  const file = searchParams.file?.trim() ?? "";
  const title = searchParams.title?.trim() || "เปิดดู PDF ผลงานนักศึกษา";
  const filename = searchParams.filename?.trim() || "student-work.pdf";
  const backContext = getSafePdfBackContext(searchParams);
  const hasFile = file.length > 0;
  const isValid = isAllowedPdfPath(file);
  const resolvedFile = resolveStudentWorkPdfUrl(file);
  const breadcrumbItems = getPdfBreadcrumbItems(backContext);

  return (
    <>
      <div className="sticky top-[72px] z-[70] border-b border-white/10 bg-slate-950/90 backdrop-blur-xl lg:top-[88px]">
        <div className="container-wide flex min-w-0 justify-center py-2 sm:py-1.5">
          <BreadcrumbTrail
            dark
            backHref={backContext.href}
            backLabel={backContext.label}
            items={breadcrumbItems}
          />
        </div>
      </div>

      <PageHeader dark eyebrow="เปิดดูไฟล์ PDF" title={title} description="เปิดดูไฟล์ PDF ภายในเว็บไซต์" />

      <section className="section bg-white">
        <div className="container-wide">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Link
              href={backContext.href}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {backContext.label}
            </Link>

            {hasFile && isValid && resolvedFile && (
              <div className="notranslate flex flex-wrap gap-2" translate="no">
                <a
                  href={resolvedFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  translate="no"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  เปิดในแท็บใหม่
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href={resolvedFile}
                  download={filename}
                  translate="no"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  ดาวน์โหลด PDF
                  <Download className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {!hasFile ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <FileWarning className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <h2 className="font-semibold text-slate-900">ยังไม่มีไฟล์ PDF</h2>
              <p className="mt-2 text-sm text-slate-500">ไม่พบ path ของไฟล์ PDF สำหรับเปิดดู</p>
            </div>
          ) : !isValid ? (
            <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 px-6 py-16 text-center">
              <FileWarning className="mx-auto mb-4 h-10 w-10 text-red-300" />
              <h2 className="font-semibold text-red-900">path ไฟล์ PDF ไม่ถูกต้อง</h2>
              <p className="mt-2 text-sm text-red-600">
                รองรับเฉพาะ path ที่ขึ้นต้นด้วย /, http:// หรือ https:// เท่านั้น
              </p>
            </div>
          ) : resolvedFile ? (
            <div className="notranslate overflow-hidden rounded-3xl border border-slate-200 bg-slate-100" translate="no">
              <object data={resolvedFile} type="application/pdf" className="h-[72vh] min-h-[420px] w-full sm:min-h-[520px]">
                <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                  <FileWarning className="mb-4 h-10 w-10 text-slate-300" />
                  <h2 className="font-semibold text-slate-900">ไม่สามารถแสดง PDF ในหน้านี้ได้</h2>
                  <p className="mt-2 max-w-xl text-sm text-slate-500">
                    เบราว์เซอร์อาจไม่รองรับการแสดง PDF หรือไฟล์ยังไม่มีอยู่จริง สามารถเปิดในแท็บใหม่หรือดาวน์โหลดได้จากปุ่มด้านบน
                  </p>
                </div>
              </object>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
