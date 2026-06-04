import { NextRequest, NextResponse } from "next/server";
import {
  buildNavigationTree,
  getPublicNavigationItems,
  isNavigationLocation,
} from "@/backend/services/navigation";
import type { NavigationLocation, NavigationTreeItem } from "@/types";

function toPublicItem(item: NavigationTreeItem): Record<string, unknown> {
  return {
    id: item.id,
    label: item.label,
    label_en: item.label_en,
    href: item.href,
    type: item.type,
    parent_id: item.parent_id,
    sort_order: item.sort_order,
    is_external: item.is_external,
    location: item.location,
    target: item.target,
    description: item.description,
    description_en: item.description_en,
    children: item.children.map(toPublicItem),
  };
}

export async function GET(request: NextRequest) {
  const rawLocation = request.nextUrl.searchParams.get("location");
  if (rawLocation && !isNavigationLocation(rawLocation)) {
    return NextResponse.json({ error: "location ไม่ถูกต้อง" }, { status: 400 });
  }
  const location: NavigationLocation | undefined = rawLocation
    ? (rawLocation as NavigationLocation)
    : undefined;

  try {
    const items = await getPublicNavigationItems(location);
    const tree = buildNavigationTree(items).map(toPublicItem);
    return NextResponse.json({ navigation: tree });
  } catch (error) {
    console.error("Public navigation GET failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "ไม่สามารถโหลดเมนูได้" }, { status: 500 });
  }
}
