import { NextRequest, NextResponse } from "next/server";
import {
  buildNavigationTree,
  getAdminNavigationItems,
  parseNavigationPayload,
} from "@/backend/services/navigation";
import { requireEffectivePermission } from "@/lib/serverAuth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { NavigationItem } from "@/types";

const NAVIGATION_SELECT =
  "id,label,label_en,href,type,parent_id,sort_order,is_active,is_external,is_core,location,target,description,description_en,created_at,updated_at";

async function requireNavigationManager(request: NextRequest) {
  return requireEffectivePermission(request, "manage_pages");
}

export async function GET(request: NextRequest) {
  const auth = await requireNavigationManager(request);
  if (auth.error) return auth.error;

  try {
    const items = await getAdminNavigationItems();
    return NextResponse.json({ navigation: items, tree: buildNavigationTree(items) });
  } catch (error) {
    console.error("Admin navigation GET failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลเมนูได้" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireNavigationManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseNavigationPayload(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("navigation_items")
    .insert({ ...parsed.payload, is_core: false })
    .select(NAVIGATION_SELECT)
    .single<NavigationItem>();

  if (error) {
    console.error("Admin navigation POST failed:", error.message);
    return NextResponse.json({ error: "เพิ่มเมนูไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ navigation_item: data }, { status: 201 });
}
