import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_NAVIGATION_ITEMS } from "@/lib/navigationDefaults";
import type {
  NavigationItem,
  NavigationItemType,
  NavigationLocation,
  NavigationTarget,
  NavigationTreeItem,
} from "@/types";

export const navigationItemTypes: readonly NavigationItemType[] = ["link", "dropdown", "heading"];
export const navigationLocations: readonly NavigationLocation[] = [
  "navbar",
  "footer_main",
  "footer_students",
  "both",
];
export const navigationTargets: readonly NavigationTarget[] = ["_self", "_blank"];

export type NavigationPayload = {
  label: string;
  label_en: string | null;
  href: string | null;
  type: NavigationItemType;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_external: boolean;
  location: NavigationLocation;
  target: NavigationTarget | null;
  description: string | null;
  description_en: string | null;
};

type ValidationResult = { ok: true; href: string | null } | { ok: false; error: string };

const unsafeSchemePattern = /^(javascript|data|vbscript):/i;

export function isNavigationLocation(value: unknown): value is NavigationLocation {
  return typeof value === "string" && navigationLocations.includes(value as NavigationLocation);
}

export function isNavigationItemType(value: unknown): value is NavigationItemType {
  return typeof value === "string" && navigationItemTypes.includes(value as NavigationItemType);
}

export function isNavigationTarget(value: unknown): value is NavigationTarget {
  return typeof value === "string" && navigationTargets.includes(value as NavigationTarget);
}

export function validateNavigationHref(input: {
  href: unknown;
  is_external?: unknown;
  type?: unknown;
}): ValidationResult {
  const type = isNavigationItemType(input.type) ? input.type : "link";
  const href = typeof input.href === "string" ? input.href.trim() : "";
  const isExternal = input.is_external === true;

  if (type !== "link") {
    if (!href) return { ok: true, href: null };
  } else if (!href) {
    return { ok: false, error: "กรุณาระบุ href สำหรับเมนูชนิด link" };
  }

  if (unsafeSchemePattern.test(href)) {
    return { ok: false, error: "ไม่อนุญาต URL scheme ที่ไม่ปลอดภัย" };
  }

  if (isExternal) {
    if (!/^https?:\/\//i.test(href)) {
      return { ok: false, error: "ลิงก์ภายนอกต้องขึ้นต้นด้วย http:// หรือ https://" };
    }
    return { ok: true, href };
  }

  if (!href.startsWith("/") || href.startsWith("//")) {
    return { ok: false, error: "ลิงก์ภายในต้องขึ้นต้นด้วย / และต้องไม่ขึ้นต้นด้วย //" };
  }

  return { ok: true, href };
}

function sortNavigationItems(items: NavigationItem[]) {
  return [...items].sort((a, b) => {
    const parentA = a.parent_id ?? "";
    const parentB = b.parent_id ?? "";
    if (parentA !== parentB) return parentA.localeCompare(parentB);
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.label.localeCompare(b.label, "th");
  });
}

export function buildNavigationTree(items: NavigationItem[]): NavigationTreeItem[] {
  const sorted = sortNavigationItems(items);
  const byId = new Map<string, NavigationTreeItem>();
  const roots: NavigationTreeItem[] = [];

  for (const item of sorted) {
    byId.set(item.id, { ...item, children: [] });
  }

  for (const item of sorted) {
    const node = byId.get(item.id);
    if (!node) continue;

    const parent = item.parent_id ? byId.get(item.parent_id) : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getPublicNavigationItems(location?: NavigationLocation) {
  const supabase = createServerSupabaseClient();
  let query = supabase.from("navigation_items").select("*").eq("is_active", true);
  if (location === "both") {
    query = query.eq("location", location);
  } else if (location) {
    query = query.in("location", [location, "both"]);
  }

  const { data, error } = await query.returns<NavigationItem[]>();
  if (error) throw new Error(`Supabase query failed: getPublicNavigationItems. ${error.message}`);
  return sortNavigationItems(data ?? []);
}

export async function getAdminNavigationItems() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("navigation_items").select("*").returns<NavigationItem[]>();
  if (error) throw new Error(`Supabase query failed: getAdminNavigationItems. ${error.message}`);
  return sortNavigationItems(data ?? []);
}

export async function resetCoreNavigationItems(location?: NavigationLocation) {
  const defaults = DEFAULT_NAVIGATION_ITEMS.filter((item) => {
    if (!item.is_core) return false;
    if (!location) return true;
    return item.location === location;
  });

  if (defaults.length === 0) {
    return { resetCount: 0, navigation: await getAdminNavigationItems() };
  }

  const admin = createSupabaseAdminClient();
  const orderedDefaults = [...defaults].sort((a, b) => {
    if (a.parent_id && !b.parent_id) return 1;
    if (!a.parent_id && b.parent_id) return -1;
    return a.sort_order - b.sort_order;
  });

  const { error } = await admin
    .from("navigation_items")
    .upsert(orderedDefaults, { onConflict: "id" });

  if (error) {
    throw new Error(`Supabase query failed: resetCoreNavigationItems. ${error.message}`);
  }

  return { resetCount: orderedDefaults.length, navigation: await getAdminNavigationItems() };
}

export function parseNavigationPayload(
  body: Record<string, unknown>,
  current?: Pick<NavigationItem, "type" | "href" | "is_external" | "label" | "label_en">
): { payload: Partial<NavigationPayload> } | { error: string } {
  const payload: Partial<NavigationPayload> = {};

  if ("label" in body) {
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) return { error: "กรุณาระบุชื่อเมนู" };
    payload.label = label;
  } else if (!current) {
    return { error: "กรุณาระบุชื่อเมนู" };
  }

  if ("label_en" in body || !current) {
    payload.label_en =
      typeof body.label_en === "string" && body.label_en.trim()
        ? body.label_en.trim()
        : null;
  }

  const type = "type" in body ? body.type : current?.type ?? "link";
  if (!isNavigationItemType(type)) return { error: "ชนิดเมนูไม่ถูกต้อง" };
  payload.type = type;

  if ("location" in body || !current) {
    const location = body.location ?? "navbar";
    if (!isNavigationLocation(location)) return { error: "ตำแหน่งเมนูไม่ถูกต้อง" };
    payload.location = location;
  }

  const isExternal =
    "is_external" in body ? body.is_external === true : current?.is_external === true;
  payload.is_external = isExternal;

  const hrefInput = "href" in body ? body.href : current?.href ?? null;
  const hrefResult = validateNavigationHref({ href: hrefInput, is_external: isExternal, type });
  if (!hrefResult.ok) return { error: hrefResult.error };
  payload.href = hrefResult.href;

  if ("parent_id" in body || !current) {
    payload.parent_id = typeof body.parent_id === "string" && body.parent_id.trim() ? body.parent_id.trim() : null;
  }

  if ("sort_order" in body || !current) {
    const rawSortOrder = body.sort_order ?? 0;
    const sortOrder = typeof rawSortOrder === "number" ? rawSortOrder : Number(rawSortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      return { error: "ลำดับต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" };
    }
    payload.sort_order = Math.floor(sortOrder);
  }

  if ("is_active" in body || !current) payload.is_active = body.is_active !== false;

  if ("target" in body || !current) {
    if (body.target === null || body.target === undefined || body.target === "") {
      payload.target = null;
    } else if (isNavigationTarget(body.target)) {
      payload.target = body.target;
    } else {
      return { error: "target ไม่ถูกต้อง" };
    }
  }

  if ("description" in body || !current) {
    payload.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }

  if ("description_en" in body || !current) {
    payload.description_en =
      typeof body.description_en === "string" && body.description_en.trim()
        ? body.description_en.trim()
        : null;
  }

  return { payload };
}

export async function navigationItemHasChildren(id: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("navigation_items")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);
  if (error) throw new Error(`Supabase query failed: navigationItemHasChildren. ${error.message}`);
  return (count ?? 0) > 0;
}
