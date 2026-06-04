import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireEffectivePermission } from "@/lib/serverAuth";

const FEATURED_LIMIT = 5;

const NEWS_COLUMNS =
  "id,title,excerpt,content,content_html,slug,category,image_url,image_alt," +
  "image_crop_settings,status,published_at,is_featured,sort_order,author_name,created_at,updated_at";

type NewsPayload = {
  id?: string;
  title?: string;
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

type AdminNewsRow = {
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

async function requireNewsManager(request: NextRequest) {
  return requireEffectivePermission(request, "manage_news");
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanStatus(value: unknown) {
  if (value === "published" || value === "archived") return value;
  return "draft";
}

function cleanDate(value: unknown, status: string) {
  const raw = cleanText(value);

  if (raw) return raw;

  // ถ้ากดเผยแพร่ แต่ไม่ได้เลือกวันที่/เวลา ให้ใช้เวลาปัจจุบันอัตโนมัติ
  return status === "published" ? new Date().toISOString() : null;
}

function toSlug(text: string): string {
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

function toPayload(body: NewsPayload) {
  const status = cleanStatus(body.status);
  const rawSlug = cleanText(body.slug);

  return {
    title: cleanText(body.title),
    excerpt: cleanText(body.excerpt),
    content: cleanText(body.content),
    content_html: cleanText(body.content_html),
    slug: rawSlug ? toSlug(rawSlug) : null,
    category: cleanText(body.category),
    image_url: cleanText(body.image_url),
    image_alt: cleanText(body.image_alt),
    image_crop_settings:
      body.image_crop_settings && typeof body.image_crop_settings === "object"
        ? body.image_crop_settings
        : {},

    // ไม่รับชื่อจริงจากฟอร์ม บังคับเป็น Admin เสมอ
    author_name: "Admin",

    status,
    published_at: cleanDate(body.published_at, status),
    is_featured:
      typeof body.is_featured === "boolean" ? body.is_featured : false,
    sort_order:
      typeof body.sort_order === "number" && isFinite(body.sort_order)
        ? Math.round(body.sort_order)
        : 0,
  };
}

async function getFeaturedCount(admin: ReturnType<typeof createSupabaseAdminClient>, excludeId?: string) {
  let query = admin
    .from("news")
    .select("id", { count: "exact", head: true })
    .eq("is_featured", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error("ไม่สามารถตรวจสอบจำนวนข่าวเด่นได้");
  }

  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const auth = await requireNewsManager(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("news")
    .select(NEWS_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข่าวได้" },
      { status: 500 },
    );
  }

  return NextResponse.json({ news: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireNewsManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as NewsPayload;
  const payload = toPayload(body);

  if (!payload.title) {
    return NextResponse.json(
      { error: "กรุณากรอกหัวข้อข่าว" },
      { status: 400 },
    );
  }

  if (!payload.slug) {
    payload.slug = toSlug(payload.title);
  }

  const admin = createSupabaseAdminClient();

  // จำกัดข่าวเด่นไม่เกิน 5 ข่าว
  if (payload.is_featured) {
    try {
      const featuredCount = await getFeaturedCount(admin);

      if (featuredCount >= FEATURED_LIMIT) {
        return NextResponse.json(
          { error: `ข่าวเด่นกำหนดได้สูงสุด ${FEATURED_LIMIT} ข่าว` },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "ไม่สามารถตรวจสอบจำนวนข่าวเด่นได้" },
        { status: 500 },
      );
    }
  }

  // Check slug uniqueness
  if (payload.slug) {
    const { data: existing } = await admin
      .from("news")
      .select("id")
      .eq("slug", payload.slug)
      .maybeSingle();

    if (existing) {
      payload.slug = payload.slug + "-" + Date.now().toString(36);
    }
  }

  const { data, error } = await admin
    .from("news")
    .insert(payload)
    .select(NEWS_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถเพิ่มข่าวได้" },
      { status: 500 },
    );
  }

  return NextResponse.json({ newsItem: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireNewsManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as NewsPayload;
  const id = cleanText(body.id);

  if (!id) {
    return NextResponse.json(
      { error: "ไม่พบรหัสข่าว" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: existingData, error: existingError } = await admin
    .from("news")
    .select(NEWS_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  const existingRow = existingData as AdminNewsRow | null;

  if (existingError || !existingRow) {
    return NextResponse.json(
      { error: "ไม่พบข่าวที่ต้องการแก้ไข" },
      { status: 404 },
    );
  }

  const incoming = toPayload(body);

  const nextStatus = Object.prototype.hasOwnProperty.call(body, "status")
    ? incoming.status
    : existingRow.status ?? "draft";

  const payload = {
    title: incoming.title ?? existingRow.title,

    excerpt: Object.prototype.hasOwnProperty.call(body, "excerpt")
      ? incoming.excerpt
      : existingRow.excerpt,

    content: Object.prototype.hasOwnProperty.call(body, "content")
      ? incoming.content
      : existingRow.content,

    content_html: Object.prototype.hasOwnProperty.call(body, "content_html")
      ? incoming.content_html
      : existingRow.content_html,

    slug: Object.prototype.hasOwnProperty.call(body, "slug")
      ? incoming.slug
      : existingRow.slug,

    category: Object.prototype.hasOwnProperty.call(body, "category")
      ? incoming.category
      : existingRow.category,

    image_url: Object.prototype.hasOwnProperty.call(body, "image_url")
      ? incoming.image_url
      : existingRow.image_url,

    image_alt: Object.prototype.hasOwnProperty.call(body, "image_alt")
      ? incoming.image_alt
      : existingRow.image_alt,

    image_crop_settings: Object.prototype.hasOwnProperty.call(
      body,
      "image_crop_settings",
    )
      ? incoming.image_crop_settings
      : existingRow.image_crop_settings ?? {},

    // บังคับเป็น Admin เสมอ
    author_name: "Admin",

    status: nextStatus,

    // ถ้ามี published_at ส่งมา ใช้ค่าที่ส่งมา
    // ถ้าเปลี่ยนสถานะเป็น published แล้วไม่มีเวลาเดิม ให้ใช้เวลาปัจจุบัน
    published_at: Object.prototype.hasOwnProperty.call(body, "published_at")
      ? incoming.published_at
      : nextStatus === "published" && !existingRow.published_at
        ? new Date().toISOString()
        : existingRow.published_at,

    is_featured: Object.prototype.hasOwnProperty.call(body, "is_featured")
      ? incoming.is_featured
      : existingRow.is_featured ?? false,

    sort_order: Object.prototype.hasOwnProperty.call(body, "sort_order")
      ? incoming.sort_order
      : existingRow.sort_order ?? 0,
  };

  if (!payload.title) {
    return NextResponse.json(
      { error: "กรุณากรอกหัวข้อข่าว" },
      { status: 400 },
    );
  }

  if (!payload.slug) {
    payload.slug = toSlug(payload.title);
  }

  // จำกัดข่าวเด่นไม่เกิน 5 ข่าว
  if (payload.is_featured) {
    try {
      const featuredCount = await getFeaturedCount(admin, id);

      if (featuredCount >= FEATURED_LIMIT) {
        return NextResponse.json(
          { error: `ข่าวเด่นกำหนดได้สูงสุด ${FEATURED_LIMIT} ข่าว` },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "ไม่สามารถตรวจสอบจำนวนข่าวเด่นได้" },
        { status: 500 },
      );
    }
  }

  // Check slug uniqueness against other rows
  if (payload.slug) {
    const { data: existing } = await admin
      .from("news")
      .select("id")
      .eq("slug", payload.slug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${payload.slug}" ถูกใช้แล้ว กรุณาเปลี่ยน slug` },
        { status: 409 },
      );
    }
  }

  const { data, error } = await admin
    .from("news")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(NEWS_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข่าวได้" },
      { status: 500 },
    );
  }

  return NextResponse.json({ newsItem: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireNewsManager(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));
  const mode = cleanText(searchParams.get("mode"));

  if (!id) {
    return NextResponse.json(
      { error: "ไม่พบรหัสข่าว" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  // ลบถาวร: /api/admin/news?id=xxx&mode=delete
  if (mode === "delete") {
    const { error } = await admin.from("news").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "ไม่สามารถลบข่าวได้" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  // ซ่อนข่าว: /api/admin/news?id=xxx
  const { data, error } = await admin
    .from("news")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(NEWS_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถซ่อนข่าวได้" },
      { status: 500 },
    );
  }

  return NextResponse.json({ newsItem: data });
}