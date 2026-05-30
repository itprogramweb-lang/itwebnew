import type {
  NavigationItem,
  NavigationItemType,
  NavigationLocation,
  NavigationTarget,
} from "@/types";

export type NavigationForm = {
  label: string;
  href: string;
  type: NavigationItemType;
  parent_id: string;
  sort_order: string;
  is_active: boolean;
  is_external: boolean;
  location: NavigationLocation;
  target: "" | NavigationTarget;
  description: string;
};

export const typeOptions: { value: NavigationItemType; label: string }[] = [
  { value: "link", label: "ลิงก์" },
  { value: "dropdown", label: "Dropdown" },
  { value: "heading", label: "หัวข้อ" },
];

export const locationOptions: { value: NavigationLocation; label: string }[] = [
  { value: "navbar", label: "Navbar" },
  { value: "footer_main", label: "Footer: เมนูหลัก" },
  { value: "footer_students", label: "Footer: สำหรับนักศึกษา" },
  { value: "both", label: "Navbar และ Footer" },
];

export const locationLabels: Record<NavigationLocation, string> = {
  navbar: "Navbar",
  footer_main: "Footer เมนูหลัก",
  footer_students: "Footer สำหรับนักศึกษา",
  both: "Navbar และ Footer",
};

export const targetOptions: { value: "" | NavigationTarget; label: string }[] = [
  { value: "", label: "ไม่กำหนด" },
  { value: "_self", label: "_self" },
  { value: "_blank", label: "_blank" },
];

export function emptyNavigationForm(): NavigationForm {
  return {
    label: "",
    href: "",
    type: "link",
    parent_id: "",
    sort_order: "0",
    is_active: true,
    is_external: false,
    location: "navbar",
    target: "",
    description: "",
  };
}

export function toNavigationForm(item: NavigationItem): NavigationForm {
  return {
    label: item.label,
    href: item.href ?? "",
    type: item.type,
    parent_id: item.parent_id ?? "",
    sort_order: String(item.sort_order ?? 0),
    is_active: item.is_active !== false,
    is_external: item.is_external === true,
    location: item.location,
    target: item.target ?? "",
    description: item.description ?? "",
  };
}

export function getParentLabel(items: NavigationItem[], parentId: string | null) {
  if (!parentId) return "-";
  return items.find((item) => item.id === parentId)?.label ?? "ไม่พบ parent";
}

export function getChildCounts(items: NavigationItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.parent_id) continue;
    counts.set(item.parent_id, (counts.get(item.parent_id) ?? 0) + 1);
  }
  return counts;
}

export function sortNavigationItems(items: NavigationItem[]) {
  return [...items].sort((a, b) => {
    if (a.location !== b.location) return a.location.localeCompare(b.location);
    const parentA = a.parent_id ?? "";
    const parentB = b.parent_id ?? "";
    if (parentA !== parentB) return parentA.localeCompare(parentB);
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.label.localeCompare(b.label, "th");
  });
}

export function getNavigationGroupKey(item: Pick<NavigationItem, "location" | "parent_id">) {
  return `${item.location}:${item.parent_id ?? "root"}`;
}

export function sortNavigationGroup(items: NavigationItem[]) {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.label.localeCompare(b.label, "th");
  });
}

export function getFriendlyOrderMap(items: NavigationItem[]) {
  const groups = new Map<string, NavigationItem[]>();
  for (const item of items) {
    const key = getNavigationGroupKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const orderMap = new Map<string, number>();
  for (const groupItems of groups.values()) {
    sortNavigationGroup(groupItems).forEach((item, index) => {
      orderMap.set(item.id, index + 1);
    });
  }
  return orderMap;
}

export function getNavigationDisplayItems(items: NavigationItem[]) {
  const result: NavigationItem[] = [];
  const byParent = new Map<string, NavigationItem[]>();
  const rootsByLocation = new Map<NavigationLocation, NavigationItem[]>();
  const attached = new Set<string>();

  for (const item of items) {
    if (item.parent_id) {
      byParent.set(item.parent_id, [...(byParent.get(item.parent_id) ?? []), item]);
    } else {
      rootsByLocation.set(item.location, [...(rootsByLocation.get(item.location) ?? []), item]);
    }
  }

  for (const location of ["navbar", "footer_main", "footer_students", "both"] as NavigationLocation[]) {
    for (const root of sortNavigationGroup(rootsByLocation.get(location) ?? [])) {
      result.push(root);
      attached.add(root.id);
      for (const child of sortNavigationGroup(byParent.get(root.id) ?? [])) {
        result.push(child);
        attached.add(child.id);
      }
    }
  }

  for (const item of sortNavigationItems(items)) {
    if (!attached.has(item.id)) result.push(item);
  }

  return result;
}

export function validateNavigationForm(form: NavigationForm): string[] {
  const errors: string[] = [];
  const href = form.href.trim();
  const sortOrder = Number(form.sort_order);

  if (!form.label.trim()) errors.push("กรุณากรอกชื่อเมนู");
  if (!form.type) errors.push("กรุณาเลือกชนิดเมนู");
  if (!form.location) errors.push("กรุณาเลือกตำแหน่งเมนู");
  if (!Number.isFinite(sortOrder) || sortOrder < 0) errors.push("ลำดับต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
  if (form.target && form.target !== "_self" && form.target !== "_blank") errors.push("target ไม่ถูกต้อง");

  if (/^(javascript|data|vbscript):/i.test(href)) {
    errors.push("ไม่อนุญาต URL scheme ที่ไม่ปลอดภัย");
  }

  if (form.type === "link") {
    if (!href) {
      errors.push("เมนูชนิดลิงก์ต้องมี href");
    } else if (form.is_external) {
      if (!/^https?:\/\//i.test(href)) {
        errors.push("ลิงก์ภายนอกต้องขึ้นต้นด้วย http:// หรือ https://");
      }
    } else if (!href.startsWith("/") || href.startsWith("//")) {
      errors.push("ลิงก์ภายในต้องขึ้นต้นด้วย / และต้องไม่ขึ้นต้นด้วย //");
    }
  }

  return errors;
}
