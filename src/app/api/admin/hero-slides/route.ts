import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireEffectivePermission } from "@/lib/serverAuth";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

type HeroSlideOrderRow = {
  id: string;
  sort_order: number | null;
  created_at: string | null;
};

type SortOrderInput = number | null;

async function requireAuth(request: NextRequest) {
  return requireEffectivePermission(request, "manage_hero_slides");
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;

  const t = v.trim();

  return t.length > 0 ? t : null;
}

function hasOwn(obj: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function readDesiredSortOrder(value: unknown): SortOrderInput {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return null;

  const order = Math.trunc(parsed);

  return order > 0 ? order : null;
}

function sortSlidesForDisplay(slides: HeroSlideOrderRow[]) {
  return [...slides].sort((a, b) => {
    const aHasOrder =
      Number.isFinite(Number(a.sort_order)) && Number(a.sort_order) > 0;
    const bHasOrder =
      Number.isFinite(Number(b.sort_order)) && Number(b.sort_order) > 0;

    if (aHasOrder && bHasOrder) {
      const diff = Number(a.sort_order) - Number(b.sort_order);
      if (diff !== 0) return diff;
    }

    if (aHasOrder && !bHasOrder) return -1;
    if (!aHasOrder && bHasOrder) return 1;

    const createdA = a.created_at ?? "";
    const createdB = b.created_at ?? "";

    if (createdA !== createdB) return createdA.localeCompare(createdB);

    return a.id.localeCompare(b.id);
  });
}

async function getHeroSlides(admin: SupabaseAdmin) {
  const { data, error } = await admin
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

async function normalizeHeroSlideOrder(
  admin: SupabaseAdmin,
  movedId: string,
  desiredSortOrder: number
) {
  const { data: rows, error: fetchError } = await admin
    .from("hero_slides")
    .select("id,sort_order,created_at")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (fetchError) throw fetchError;

  const orderedRows = sortSlidesForDisplay((rows ?? []) as HeroSlideOrderRow[]);

  const movingRow = orderedRows.find((row) => row.id === movedId);

  if (!movingRow) return null;

  const rowsWithOrder = orderedRows.filter((row) => {
    if (row.id === movedId) return false;

    return Number.isFinite(Number(row.sort_order)) && Number(row.sort_order) > 0;
  });

  const targetOrder = Math.min(
    Math.max(Math.trunc(desiredSortOrder), 1),
    rowsWithOrder.length + 1
  );

  const nextRows = [...rowsWithOrder];

  nextRows.splice(targetOrder - 1, 0, movingRow);

  for (let index = 0; index < nextRows.length; index += 1) {
    const row = nextRows[index];
    const nextSortOrder = index + 1;

    if (row.sort_order === nextSortOrder) continue;

    const { error } = await admin
      .from("hero_slides")
      .update({ sort_order: nextSortOrder })
      .eq("id", row.id);

    if (error) throw error;
  }

  const slides = await getHeroSlides(admin);

  return {
    slide: slides.find((slide) => slide.id === movedId) ?? null,
    slides,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();

  try {
    const slides = await getHeroSlides(admin);

    return NextResponse.json({ slides });
  } catch (error) {
    console.error("GET /api/admin/hero-slides error:", error);

    return NextResponse.json(
      { error: "โหลดข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);

  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const desiredSortOrder = readDesiredSortOrder(body.sort_order);
  const admin = createSupabaseAdminClient();

  const payload = {
    ...body,
    sort_order: desiredSortOrder,
  };

  const { data, error } = await admin
    .from("hero_slides")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("POST /api/admin/hero-slides insert error:", error);

    return NextResponse.json(
      { error: "เพิ่มสไลด์ไม่สำเร็จ" },
      { status: 500 }
    );
  }

  if (desiredSortOrder === null) {
    try {
      const slides = await getHeroSlides(admin);

      return NextResponse.json({ slide: data, slides }, { status: 201 });
    } catch (error) {
      console.error("POST /api/admin/hero-slides reload error:", error);

      return NextResponse.json({ slide: data, slides: [data] }, { status: 201 });
    }
  }

  try {
    const reordered = await normalizeHeroSlideOrder(
      admin,
      data.id,
      desiredSortOrder
    );

    return NextResponse.json(
      {
        slide: reordered?.slide ?? data,
        slides: reordered?.slides ?? [data],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/hero-slides reorder error:", error);

    return NextResponse.json(
      { error: "เพิ่มสไลด์แล้ว แต่จัดลำดับไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);

  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);

  if (!id) {
    return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });
  }

  const hasSortOrder = hasOwn(body, "sort_order");
  const desiredSortOrder = readDesiredSortOrder(body.sort_order);

  const { id: ignoredId, sort_order: ignoredSortOrder, ...payload } = body;

  void ignoredId;
  void ignoredSortOrder;

  if (hasSortOrder) {
    payload.sort_order = desiredSortOrder;
  }

  const admin = createSupabaseAdminClient();

  const { data: current, error: currentError } = await admin
    .from("hero_slides")
    .select("id,sort_order")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    console.error("PATCH /api/admin/hero-slides current error:", currentError);

    return NextResponse.json(
      { error: "โหลดสไลด์ไม่สำเร็จ" },
      { status: 500 }
    );
  }

  if (!current) {
    return NextResponse.json({ error: "ไม่พบสไลด์" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("hero_slides")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/admin/hero-slides update error:", error);

    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }

  if (!hasSortOrder || desiredSortOrder === null) {
    try {
      const slides = await getHeroSlides(admin);

      return NextResponse.json({ slide: data, slides });
    } catch (error) {
      console.error("PATCH /api/admin/hero-slides reload error:", error);

      return NextResponse.json({ slide: data, slides: [data] });
    }
  }

  try {
    const reordered = await normalizeHeroSlideOrder(
      admin,
      id,
      desiredSortOrder
    );

    return NextResponse.json({
      slide: reordered?.slide ?? data,
      slides: reordered?.slides ?? [data],
    });
  } catch (error) {
    console.error("PATCH /api/admin/hero-slides reorder error:", error);

    return NextResponse.json(
      { error: "บันทึกแล้ว แต่จัดลำดับไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);

  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("hero_slides").delete().eq("id", id);

  if (error) {
    console.error("DELETE /api/admin/hero-slides error:", error);

    return NextResponse.json(
      { error: "ลบสไลด์ไม่สำเร็จ" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}