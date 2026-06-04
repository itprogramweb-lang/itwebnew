import type { BrandingData } from "@/lib/brandingTypes";
import type { NavigationItem } from "@/types";

export type MenuItem =
  | {
      type: "link";
      label: string;
      labelEn?: string;
      href: string;
      external?: boolean;
    }
  | {
      type: "dropdown";
      label: string;
      labelEn?: string;
      items: {
        label: string;
        labelEn?: string;
        href: string;
        description?: string;
        descriptionEn?: string;
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
      labelEn: "Home",
      href: "/",
    },
    {
      type: "link",
      label: "สมัครเรียน",
      labelEn: "Admissions",
      href: "/apply",
    },
    {
      type: "link",
      label: "ข่าวสาร",
      labelEn: "News",
      href: "/news",
    },

    {
      type: "dropdown",
      label: "เกี่ยวกับสาขา",
      labelEn: "About",
      items: [
        {
          label: "เกี่ยวกับสาขา",
          labelEn: "About the Department",
          href: "/about",
          description: "วิสัยทัศน์ พันธกิจ และจุดเด่น",
          descriptionEn: "Vision, Mission, and Highlights",
        },
        {
          label: "บุคลากร",
          labelEn: "Faculty and Staff",
          href: "/about/staff",
          description: "อาจารย์และเจ้าหน้าที่",
          descriptionEn: "Lecturers and Staff",
        },
        {
          label: "อุปกรณ์การเรียนและห้องปฏิบัติการ",
          labelEn: "Facilities and Laboratories",
          href: "/about/facilities",
          description: "ห้องเรียน ห้องปฏิบัติการ และอุปกรณ์สนับสนุนการเรียน",
          descriptionEn: "Classrooms, Laboratories, and Learning Facilities",
        },
        {
          label: "ติดต่อ",
          labelEn: "Contact",
          href: "/about/contact",
          description: "ที่อยู่ และแผนที่",
          descriptionEn: "Address and Map",
        },
      ],
    },
    {
      type: "dropdown",
      label: "หลักสูตร",
      labelEn: "Programs",
      items: [
        {
          label: "ปริญญาตรี",
          labelEn: "Undergraduate Program",
          href: "/programs/bachelor",
          description: "หลักสูตร 4 ปี",
          descriptionEn: "4-Year Program",
        },
        {
          label: "ปริญญาโท",
          labelEn: "Graduate Program",
          href: "/programs/master",
          description: "หลักสูตร 2 ปี",
          descriptionEn: "2-Year Program",
        },
      ],
    },
    {
      type: "dropdown",
      label: "ผลงาน",
      labelEn: "Works",
      items: [
        {
          label: "ผลงานนักศึกษา",
          labelEn: "Student Works",
          href: "/works/students",
          description: "ปริญญานิพนธ์ (Thesis) และรางวัล",
          descriptionEn: "Theses and Awards",
        },
        {
          label: "ผลงานอาจารย์",
          labelEn: "Faculty Works",
          href: "/works/teachers",
          description: "งานวิจัยและบทความ",
          descriptionEn: "Research and Publications",
        },
      ],
    },
    {
      type: "dropdown",
      label: "นักศึกษาปัจจุบัน",
      labelEn: "Current Students",
      items: [
        {
          label: "ทะเบียน",
          labelEn: "Registration",
          href: "/students/registration",
        },
        {
          label: "กยศ.",
          labelEn: "Student Loan Fund",
          href: loanUrl,
          external: true,
        },
        {
          label: "สวัสดิการ",
          labelEn: "Student Welfare",
          href: welfareUrl,
          external: true,
        },
        {
          label: "ร้องเรียน/ความคิดเห็น",
          labelEn: "Complaints and Feedback",
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
    labelEn: item.label_en ?? undefined,
    href: item.href?.trim() ?? "",
    description: item.description ?? undefined,
    descriptionEn: item.description_en ?? undefined,
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
        labelEn: root.label_en ?? undefined,
        items: children.map(toChildMenuItem),
      });
      continue;
    }

    if (root.type === "link" && isValidHref(root)) {
      menuItems.push({
        type: "link",
        label: root.label,
        labelEn: root.label_en ?? undefined,
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
