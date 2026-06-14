export const MAX_COMPLAINT_ATTACHMENT_COUNT = 5;

export function normalizeComplaintAttachmentUrls(value: unknown) {
  if (!Array.isArray(value)) return [];

  const urls: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") return [];

    const trimmed = item.trim();
    if (!trimmed) return [];

    urls.push(trimmed);
  }

  return urls.slice(0, MAX_COMPLAINT_ATTACHMENT_COUNT);
}

export function getComplaintAttachmentUrls(input: {
  attachment_url?: string | null;
  attachment_urls?: unknown;
}) {
  const multi = normalizeComplaintAttachmentUrls(input.attachment_urls);
  if (multi.length > 0) return multi;

  const legacy = typeof input.attachment_url === "string" ? input.attachment_url.trim() : "";
  return legacy ? [legacy] : [];
}

