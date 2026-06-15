import "server-only";

const FALLBACK_SITE_URL = "https://it.rmutt.ac.th";

function normalizeSafeOrigin(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();

    if (url.protocol !== "https:") return null;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".vercel.app")
    ) {
      return null;
    }

    return url.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getCanonicalSiteUrl() {
  return (
    normalizeSafeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSafeOrigin(process.env.SITE_URL) ??
    normalizeSafeOrigin(process.env.APP_URL) ??
    FALLBACK_SITE_URL
  );
}

export function buildCanonicalUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getCanonicalSiteUrl()}${normalizedPath}`;
}
