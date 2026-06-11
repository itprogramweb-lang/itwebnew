import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const FEATURED_LIMIT = 5;

export const NEWS_COLUMNS =
  "id,title,excerpt,content,content_html,slug,category,image_url,image_alt," +
  "image_crop_settings,status,published_at,is_featured,sort_order,author_name,created_at,updated_at";

export type NewsCreatePayload = {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  content_html?: string | null;
  slug?: string | null;
  category?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  status?: string | null;
  published_at?: string | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
  author_name?: string | null;
};

export type NewsRow = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  content_html: string | null;
  slug: string | null;
  category: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings: Record<string, unknown> | null;
  status: string | null;
  published_at: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
  author_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateNewsResult =
  | { ok: true; news: NewsRow }
  | { ok: false; reason: "missing_title" | "featured_limit" | "insert_failed" };

export function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function cleanNewsStatus(value: unknown) {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

export function cleanNewsDate(value: unknown, status: string) {
  const raw = cleanText(value);
  if (raw) return raw;
  return status === "published" ? new Date().toISOString() : null;
}

export function toNewsSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "news"
  );
}

export function toNewsCreatePayload(input: NewsCreatePayload) {
  const status = cleanNewsStatus(input.status);
  const rawSlug = cleanText(input.slug);
  const imageUrl = cleanText(input.image_url);

  return {
    title: cleanText(input.title),
    excerpt: cleanText(input.excerpt),
    content: cleanText(input.content),
    content_html: cleanText(input.content_html),
    slug: rawSlug ? toNewsSlug(rawSlug) : null,
    category: cleanText(input.category),
    image_url: imageUrl,
    image_alt: imageUrl ? cleanText(input.image_alt) : null,
    image_crop_settings:
      input.image_crop_settings && typeof input.image_crop_settings === "object"
        ? input.image_crop_settings
        : {},
    author_name: cleanText(input.author_name) ?? "Admin",
    status,
    published_at: cleanNewsDate(input.published_at, status),
    is_featured:
      typeof input.is_featured === "boolean" ? input.is_featured : false,
    sort_order:
      typeof input.sort_order === "number" && isFinite(input.sort_order)
        ? Math.round(input.sort_order)
        : 0,
  };
}

async function getFeaturedCount(excludeId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("news")
    .select("id", { count: "exact", head: true })
    .eq("is_featured", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;
  if (error) throw new Error("news_featured_count_failed");
  return count ?? 0;
}

export async function createNewsItem(
  input: NewsCreatePayload
): Promise<CreateNewsResult> {
  const payload = toNewsCreatePayload(input);

  if (!payload.title) {
    return { ok: false, reason: "missing_title" };
  }

  if (!payload.slug) {
    payload.slug = toNewsSlug(payload.title);
  }

  if (payload.is_featured) {
    const featuredCount = await getFeaturedCount();
    if (featuredCount >= FEATURED_LIMIT) {
      return { ok: false, reason: "featured_limit" };
    }
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("news")
    .select("id")
    .eq("slug", payload.slug)
    .maybeSingle();

  if (existing) {
    payload.slug = `${payload.slug}-${Date.now().toString(36)}`;
  }

  const { data, error } = await admin
    .from("news")
    .insert(payload)
    .select(NEWS_COLUMNS)
    .single<NewsRow>();

  if (error || !data) {
    return { ok: false, reason: "insert_failed" };
  }

  return { ok: true, news: data };
}

export async function getNewsUrlById(newsId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("news")
    .select("slug")
    .eq("id", newsId)
    .maybeSingle<{ slug: string | null }>();

  return data?.slug ? buildPublicNewsUrl(data.slug) : null;
}

export function buildPublicNewsUrl(slug: string) {
  const path = `/news/${slug}`;
  const siteUrl = cleanText(process.env.NEXT_PUBLIC_SITE_URL);
  if (!siteUrl) return path;
  return `${siteUrl.replace(/\/+$/, "")}${path}`;
}
