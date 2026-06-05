import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireEffectivePermission } from "@/lib/serverAuth";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

type HeroSlideOrderRow = {
  id: string;
  sort_order: number | null;
  created_at: string | null;
};

async function requireAuth(request: NextRequest) {
  return requireEffectivePermission(request, "manage_hero_slides");
}

function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function readDesiredSortOrder(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function sortSlidesForReorder(slides: HeroSlideOrderRow[]) {
  return [...slides].sort((a, b) => {
    const orderA = Number.isFinite(Number(a.sort_order)) && Number(a.sort_order) > 0
      ? Number(a.sort_order)
      : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(Number(b.sort_order)) && Number(b.sort_order) > 0
      ? Number(b.sort_order)
      : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    const createdA = a.created_at ?? "";
    const createdB = b.created_at ?? "";
    if (createdA !== createdB) return createdA.localeCompare(createdB);
    return a.id.localeCompare(b.id);
  });
}

async function normalizeHeroSlideOrder(
  admin: SupabaseAdmin,
  movedId: string,
  desiredSortOrder: number
) {
  const { data: rows, error: fetchError } = await admin
    .from("hero_slides")
    .select("id,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (fetchError) throw fetchError;

  const orderedRows = sortSlidesForReorder((rows ?? []) as HeroSlideOrderRow[]);
  const movingRow = orderedRows.find((row) => row.id === movedId);
  if (!movingRow) return null;

  const remainingRows = orderedRows.filter((row) => row.id !== movedId);
  const targetOrder = Math.min(
    Math.max(readDesiredSortOrder(desiredSortOrder, movingRow.sort_order ?? 1), 1),
    remainingRows.length + 1
  );
  const nextRows = [...remainingRows];
  nextRows.splice(targetOrder - 1, 0, movingRow);

  const updates = nextRows
    .map((row, index) => ({ id: row.id, sort_order: index + 1 }))
    .filter((row) => {
      const current = nextRows.find((item) => item.id === row.id)?.sort_order;
      return current !== row.sort_order;
    });

  for (const row of updates) {
    const { error } = await admin
      .from("hero_slides")
      .update({ sort_order: row.sort_order })
      .eq("id", row.id);
    if (error) throw error;
  }

  const { data: slides, error } = await admin
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return {
    slide: (slides ?? []).find((slide) => slide.id === movedId) ?? null,
    slides: slides ?? [],
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ slides: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const desiredSortOrder = readDesiredSortOrder(body.sort_order, 1);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("hero_slides")
    .insert(body)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "เพิ่มสไลด์ไม่สำเร็จ" }, { status: 500 });

  try {
    const reordered = await normalizeHeroSlideOrder(admin, data.id, desiredSortOrder);
    return NextResponse.json(
      { slide: reordered?.slide ?? data, slides: reordered?.slides ?? [data] },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "เพิ่มสไลด์แล้ว แต่จัดลำดับไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Record<string, unknown>;
  const id = cleanText(body.id);
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const { id: _id, sort_order: sortOrder, ...payload } = body;
  const admin = createSupabaseAdminClient();
  const { data: current, error: currentError } = await admin
    .from("hero_slides")
    .select("id,sort_order")
    .eq("id", id)
    .maybeSingle();

  if (currentError) return NextResponse.json({ error: "โหลดสไลด์ไม่สำเร็จ" }, { status: 500 });
  if (!current) return NextResponse.json({ error: "ไม่พบสไลด์" }, { status: 404 });

  const desiredSortOrder = readDesiredSortOrder(sortOrder, current.sort_order ?? 1);
  const { data, error } = await admin
    .from("hero_slides")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });

  try {
    const reordered = await normalizeHeroSlideOrder(admin, id, desiredSortOrder);
    return NextResponse.json({ slide: reordered?.slide ?? data, slides: reordered?.slides ?? [data] });
  } catch {
    return NextResponse.json({ error: "บันทึกแล้ว แต่จัดลำดับไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ไม่พบ id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("hero_slides")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "ลบสไลด์ไม่สำเร็จ" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
