import { NextRequest, NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

async function requireAuth(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);

  if (!profile) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // ช่วงแรกใช้ permission เดิมก่อนก็ได้
  // ถ้าอยากทำแยกจริง ค่อยเพิ่ม permission ชื่อ manage_facilities ทีหลัง
  if (!can(profile.role, "manage_staff")) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { profile };
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function cleanArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof v === "string") {
    return v
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function cleanNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function cleanGalleryImages(v: unknown) {
  if (!Array.isArray(v)) return [];

  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const image = item as Record<string, unknown>;
      const url = cleanText(image.url);

      if (!url) return null;

      return {
        url,
        alt: cleanText(image.alt),
        caption: cleanText(image.caption),
        sort_order: cleanNumber(image.sort_order),
      };
    })
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("learning_facilities")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "โหลดข้อมูลไม่สำเร็จ: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ facilities: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;

  const payload = {
    type: cleanText(body.type) ?? "lab",
    title: cleanText(body.title),
    slug: cleanText(body.slug),

    short_description: cleanText(body.short_description),
    description: cleanText(body.description),

    cover_image_url: cleanText(body.cover_image_url),
    cover_image_alt: cleanText(body.cover_image_alt),
    cover_image_crop: body.cover_image_crop ?? null,

    gallery_images: cleanGalleryImages(body.gallery_images),

    location: cleanText(body.location),
    capacity: cleanText(body.capacity),

    highlights: cleanArray(body.highlights),
    equipment_list: cleanArray(body.equipment_list),

    is_featured: Boolean(body.is_featured),
    is_active: body.is_active !== false,
    sort_order: cleanNumber(body.sort_order),
  };

  if (!payload.title) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อรายการ" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("learning_facilities")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "เพิ่มข้อมูลไม่สำเร็จ: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ facility: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);

  if (!id) {
    return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });
  }

  const payload = {
    type: cleanText(body.type) ?? "lab",
    title: cleanText(body.title),
    slug: cleanText(body.slug),

    short_description: cleanText(body.short_description),
    description: cleanText(body.description),

    cover_image_url: cleanText(body.cover_image_url),
    cover_image_alt: cleanText(body.cover_image_alt),
    cover_image_crop: body.cover_image_crop ?? null,

    gallery_images: cleanGalleryImages(body.gallery_images),

    location: cleanText(body.location),
    capacity: cleanText(body.capacity),

    highlights: cleanArray(body.highlights),
    equipment_list: cleanArray(body.equipment_list),

    is_featured: Boolean(body.is_featured),
    is_active: body.is_active !== false,
    sort_order: cleanNumber(body.sort_order),

    updated_at: new Date().toISOString(),
  };

  if (!payload.title) {
    return NextResponse.json(
      { error: "กรุณากรอกชื่อรายการ" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("learning_facilities")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "บันทึกไม่สำเร็จ: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ facility: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);

  const id = cleanText(searchParams.get("id"));
  const mode = cleanText(searchParams.get("mode")) ?? "hide";

  if (!id) {
    return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // ลบถาวร
  if (mode === "delete") {
    const { error } = await admin
      .from("learning_facilities")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "ลบข้อมูลไม่สำเร็จ: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  // ซ่อนข้อมูล
  const { data, error } = await admin
    .from("learning_facilities")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "ซ่อนข้อมูลไม่สำเร็จ: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ facility: data });
}