import { NextRequest, NextResponse } from "next/server";
import {
  navigationItemHasChildren,
  parseNavigationPayload,
} from "@/backend/services/navigation";
import { requireEffectivePermission } from "@/lib/serverAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { NavigationItem } from "@/types";

const NAVIGATION_SELECT =
  "id,label,href,type,parent_id,sort_order,is_active,is_external,is_core,location,target,description,created_at,updated_at";

async function requireNavigationManager(request: NextRequest) {
  return requireEffectivePermission(request, "manage_pages");
}

async function getNavigationItem(id: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("navigation_items")
    .select(NAVIGATION_SELECT)
    .eq("id", id)
    .maybeSingle<NavigationItem>();
  return { admin, data, error };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireNavigationManager(request);
  if (auth.error) return auth.error;

  const { admin, data: current, error: currentError } = await getNavigationItem(params.id);
  if (currentError) return NextResponse.json({ error: "โหลดเมนูไม่สำเร็จ" }, { status: 500 });
  if (!current) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseNavigationPayload(body, current);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  if (parsed.payload.parent_id === params.id) {
    return NextResponse.json({ error: "ไม่สามารถตั้ง parent_id เป็นรายการตัวเองได้" }, { status: 400 });
  }

  if (
    current.is_core &&
    "parent_id" in parsed.payload &&
    parsed.payload.parent_id !== current.parent_id
  ) {
    return NextResponse.json({ error: "ไม่อนุญาตให้ย้าย parent ของเมนูหลัก" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("navigation_items")
    .update(parsed.payload)
    .eq("id", params.id)
    .select(NAVIGATION_SELECT)
    .single<NavigationItem>();

  if (error) {
    console.error("Admin navigation PATCH failed:", error.message);
    return NextResponse.json({ error: "บันทึกเมนูไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ navigation_item: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireNavigationManager(request);
  if (auth.error) return auth.error;

  const mode = request.nextUrl.searchParams.get("mode");
  const hardDelete = mode === "hard";

  const { admin, data: current, error: currentError } = await getNavigationItem(params.id);
  if (currentError) return NextResponse.json({ error: "โหลดเมนูไม่สำเร็จ" }, { status: 500 });
  if (!current) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });

  if (current.is_core) {
    return NextResponse.json(
      {
        error: hardDelete
          ? "เมนูหลักของระบบไม่สามารถลบถาวรได้"
          : "เมนูหลักของระบบไม่สามารถซ่อนด้วยปุ่มนี้ได้",
      },
      { status: 403 }
    );
  }

  const hasChildren = await navigationItemHasChildren(params.id);
  if (hasChildren) {
    return NextResponse.json({ error: "รายการนี้มีเมนูย่อย ต้องจัดการเมนูย่อยก่อน" }, { status: 400 });
  }

  if (hardDelete) {
    const { error } = await admin
      .from("navigation_items")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Admin navigation hard DELETE failed:", error.message);
      return NextResponse.json({ error: "ลบเมนูถาวรไม่สำเร็จ" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  }

  const { error } = await admin
    .from("navigation_items")
    .update({ is_active: false })
    .eq("id", params.id);

  if (error) {
    console.error("Admin navigation DELETE failed:", error.message);
    return NextResponse.json({ error: "ซ่อนเมนูไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, disabled: true });
}
