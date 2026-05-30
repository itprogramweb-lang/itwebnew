import type { BrandingData } from "@/lib/brandingTypes";
import type { NavigationItem } from "@/types";

export type MenuItem =
  | {
      type: "link";
      label: string;
      href: string;
      external?: boolean;
    }
  | {
      type: "dropdown";
      label: string;
      items: {
        label: string;
        href: string;
        description?: string;
        external?: boolean;
      }[];
    };

type DropdownMenuItem = Extract<MenuItem, { type: "dropdown" }>;
type DropdownChildItem = DropdownMenuItem["items"][number];

export function buildStaticMenuItems(loanUrl: string, welfareUrl: string): MenuItem[] {
  return [
    {
      type: "link",
      label: "หน้าแรก",
      href: "/",
    },
    {
      type: "link",
      label: "สมัครเรียน",
      href: "/apply",
    },
    {
      type: "link",
      label: "ข่าวสาร",
      href: "/news",
    },

    {
      type: "dropdown",
      label: "เกี่ยวกับสาขา",
      items: [
        {
          label: "เกี่ยวกับสาขา",
          href: "/about",
          description: "วิสัยทัศน์ พันธกิจ และจุดเด่น",
        },
        {
          label: "บุคลากร",
          href: "/about/staff",
          description: "อาจารย์และเจ้าหน้าที่",
        },
        {
          label: "อุปกรณ์การเรียนและห้องปฏิบัติการ",
          href: "/about/facilities",
          description: "ห้องเรียน ห้องปฏิบัติการ และอุปกรณ์สนับสนุนการเรียน",
        },
        {
          label: "ติดต่อ",
          href: "/about/contact",
          description: "ที่อยู่ และแผนที่",
        },
      ],
    },
    {
      type: "dropdown",
      label: "หลักสูตร",
      items: [
        {
          label: "ปริญญาตรี",
          href: "/programs/bachelor",
          description: "หลักสูตร 4 ปี",
        },
        {
          label: "ปริญญาโท",
          href: "/programs/master",
          description: "หลักสูตร 2 ปี",
        },
      ],
    },
    {
      type: "dropdown",
      label: "ผลงาน",
      items: [
        {
          label: "ผลงานนักศึกษา",
          href: "/works/students",
          description: "ปริญญานิพนธ์ (Thesis) และรางวัล",
        },
        {
          label: "ผลงานอาจารย์",
          href: "/works/teachers",
          description: "งานวิจัยและบทความ",
        },
      ],
    },
    {
      type: "dropdown",
      label: "นักศึกษาปัจจุบัน",
      items: [
        {
          label: "ทะเบียน",
          href: "/students/registration",
        },
        {
          label: "กยศ.",
          href: loanUrl,
          external: true,
        },
        {
          label: "สวัสดิการ",
          href: welfareUrl,
          external: true,
        },
        {
          label: "ร้องเรียน/ความคิดเห็น",
          href: "/students/complaint",
        },
      ],
    },
  ];
}

function sortByMenuOrder(items: NavigationItem[]) {
  return [...items].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.label.localeCompare(b.label, "th");
  });
}

function isValidHref(item: NavigationItem) {
  const href = item.href?.trim();
  if (!href) return false;
  if (/^(javascript|data|vbscript):/i.test(href)) return false;
  if (item.is_external) return /^https?:\/\//i.test(href);
  return href.startsWith("/") && !href.startsWith("//");
}

function toChildMenuItem(item: NavigationItem): DropdownChildItem {
  return {
    label: item.label,
    href: item.href?.trim() ?? "",
    description: item.description ?? undefined,
    external: item.is_external || item.target === "_blank" || undefined,
  };
}

export function navigationItemsToMenuItems(items: NavigationItem[]): MenuItem[] {
  const activeNavbarItems = items.filter(
    (item) => item.is_active !== false && (item.location === "navbar" || item.location === "both")
  );
  const childrenByParent = new Map<string, NavigationItem[]>();
  const roots: NavigationItem[] = [];

  for (const item of activeNavbarItems) {
    if (item.parent_id) {
      childrenByParent.set(item.parent_id, [...(childrenByParent.get(item.parent_id) ?? []), item]);
    } else {
      roots.push(item);
    }
  }

  const menuItems: MenuItem[] = [];
  for (const root of sortByMenuOrder(roots)) {
    const children = sortByMenuOrder(childrenByParent.get(root.id) ?? []).filter(isValidHref);

    if (children.length > 0 || root.type === "dropdown" || root.type === "heading") {
      if (children.length === 0) continue;
      menuItems.push({
        type: "dropdown",
        label: root.label,
        items: children.map(toChildMenuItem),
      });
      continue;
    }

    if (root.type === "link" && isValidHref(root)) {
      menuItems.push({
        type: "link",
        label: root.label,
        href: root.href?.trim() ?? "",
        external: root.is_external || root.target === "_blank" || undefined,
      });
    }
  }

  return menuItems;
}

export function getFallbackMenuItems(branding: BrandingData): MenuItem[] {
  return buildStaticMenuItems(branding.loanExternalUrl, branding.welfareExternalUrl);
}
