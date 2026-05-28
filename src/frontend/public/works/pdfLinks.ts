type PdfViewerInput = {
  file: string | null;
  title?: string | null;
  filename?: string | null;
  returnTo?: string | null;
  returnLabel?: string | null;
  source?: "student" | "teacher" | "course" | "final_project";
};

export function buildPdfViewerHref({ file, title, filename, returnTo, returnLabel, source }: PdfViewerInput) {
  const resolvedFile = resolveStudentWorkPdfUrl(file);
  if (!resolvedFile) return null;

  const params = [`file=${encodeURIComponent(resolvedFile)}`];
  if (title) params.push(`title=${encodeURIComponent(title)}`);
  if (filename) params.push(`filename=${encodeURIComponent(filename)}`);
  if (returnTo) params.push(`returnTo=${encodeURIComponent(returnTo)}`);
  if (returnLabel) params.push(`returnLabel=${encodeURIComponent(returnLabel)}`);
  if (source) params.push(`source=${encodeURIComponent(source)}`);

  return `/works/students/pdf-viewer?${params.join("&")}`;
}

export function isAllowedPdfPath(file: string | null | undefined) {
  return resolveStudentWorkPdfUrl(file) !== null;
}

function hasUnsafePathPart(path: string) {
  return path.split("/").some((part) => part === "." || part === "..");
}

export function resolveStudentWorkPdfUrl(file: string | null | undefined) {
  const value = file?.trim();
  if (!value) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  if (!value.toLowerCase().endsWith(".pdf")) return null;

  if (value.startsWith("//")) return null;
  if (value.startsWith("/")) {
    if (hasUnsafePathPart(value)) return null;
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      if (hasUnsafePathPart(url.pathname)) return null;
      if (!url.pathname.toLowerCase().endsWith(".pdf")) return null;
      return url.toString();
    } catch {
      return null;
    }
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  if (value.includes("\\") || hasUnsafePathPart(value)) return null;

  const base = process.env.NEXT_PUBLIC_STUDENT_WORKS_STORAGE_BASE_URL?.trim();
  if (!base) return null;

  try {
    return new URL(value, `${base.replace(/\/+$/, "")}/`).toString();
  } catch {
    return null;
  }
}
