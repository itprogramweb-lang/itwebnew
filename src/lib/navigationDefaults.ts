import type { NavigationItemType, NavigationLocation, NavigationTarget } from "@/types";

export type DefaultNavigationItem = {
  id: string;
  label: string;
  href: string | null;
  type: NavigationItemType;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_external: boolean;
  is_core: boolean;
  location: NavigationLocation;
  target: NavigationTarget | null;
  description: string | null;
};

export const DEFAULT_NAVIGATION_ITEMS: DefaultNavigationItem[] = [
  { id: "10000000-0000-4000-8000-000000000001", label: "หน้าแรก", href: "/", type: "link", parent_id: null, sort_order: 0, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000002", label: "สมัครเรียน", href: "/apply", type: "link", parent_id: null, sort_order: 10, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000003", label: "ข่าวสาร", href: "/news", type: "link", parent_id: null, sort_order: 20, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000004", label: "เกี่ยวกับสาขา", href: null, type: "dropdown", parent_id: null, sort_order: 30, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000005", label: "หลักสูตร", href: null, type: "dropdown", parent_id: null, sort_order: 40, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000006", label: "ผลงาน", href: null, type: "dropdown", parent_id: null, sort_order: 50, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000007", label: "นักศึกษาปัจจุบัน", href: null, type: "dropdown", parent_id: null, sort_order: 60, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000101", label: "เกี่ยวกับสาขา", href: "/about", type: "link", parent_id: "10000000-0000-4000-8000-000000000004", sort_order: 0, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "วิสัยทัศน์ พันธกิจ และจุดเด่น" },
  { id: "10000000-0000-4000-8000-000000000102", label: "บุคลากร", href: "/about/staff", type: "link", parent_id: "10000000-0000-4000-8000-000000000004", sort_order: 10, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "อาจารย์และเจ้าหน้าที่" },
  { id: "10000000-0000-4000-8000-000000000103", label: "อุปกรณ์การเรียนและห้องปฏิบัติการ", href: "/about/facilities", type: "link", parent_id: "10000000-0000-4000-8000-000000000004", sort_order: 20, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "ห้องเรียน ห้องปฏิบัติการ และอุปกรณ์สนับสนุนการเรียน" },
  { id: "10000000-0000-4000-8000-000000000104", label: "ติดต่อ", href: "/about/contact", type: "link", parent_id: "10000000-0000-4000-8000-000000000004", sort_order: 30, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "ที่อยู่ และแผนที่" },
  { id: "10000000-0000-4000-8000-000000000201", label: "ปริญญาตรี", href: "/programs/bachelor", type: "link", parent_id: "10000000-0000-4000-8000-000000000005", sort_order: 0, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "หลักสูตร 4 ปี" },
  { id: "10000000-0000-4000-8000-000000000202", label: "ปริญญาโท", href: "/programs/master", type: "link", parent_id: "10000000-0000-4000-8000-000000000005", sort_order: 10, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "หลักสูตร 2 ปี" },
  { id: "10000000-0000-4000-8000-000000000301", label: "ผลงานนักศึกษา", href: "/works/students", type: "link", parent_id: "10000000-0000-4000-8000-000000000006", sort_order: 0, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "ปริญญานิพนธ์ (Thesis) และรางวัล" },
  { id: "10000000-0000-4000-8000-000000000302", label: "ผลงานอาจารย์", href: "/works/teachers", type: "link", parent_id: "10000000-0000-4000-8000-000000000006", sort_order: 10, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: "งานวิจัยและบทความ" },
  { id: "10000000-0000-4000-8000-000000000401", label: "ทะเบียน", href: "/students/registration", type: "link", parent_id: "10000000-0000-4000-8000-000000000007", sort_order: 0, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000000402", label: "กยศ.", href: "https://sd.rmutt.ac.th/?page_id=2274", type: "link", parent_id: "10000000-0000-4000-8000-000000000007", sort_order: 10, is_active: true, is_external: true, is_core: true, location: "navbar", target: "_blank", description: null },
  { id: "10000000-0000-4000-8000-000000000403", label: "สวัสดิการ", href: "https://sd.rmutt.ac.th/", type: "link", parent_id: "10000000-0000-4000-8000-000000000007", sort_order: 20, is_active: true, is_external: true, is_core: true, location: "navbar", target: "_blank", description: null },
  { id: "10000000-0000-4000-8000-000000000404", label: "ร้องเรียน/ความคิดเห็น", href: "/students/complaint", type: "link", parent_id: "10000000-0000-4000-8000-000000000007", sort_order: 30, is_active: true, is_external: false, is_core: true, location: "navbar", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001001", label: "หน้าแรก", href: "/", type: "link", parent_id: null, sort_order: 0, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001002", label: "สมัครเรียน", href: "/apply", type: "link", parent_id: null, sort_order: 10, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001003", label: "ข่าวสาร", href: "/news", type: "link", parent_id: null, sort_order: 20, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001004", label: "เกี่ยวกับสาขา", href: "/about", type: "link", parent_id: null, sort_order: 30, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001005", label: "อุปกรณ์การเรียนและห้องปฏิบัติการ", href: "/about/facilities", type: "link", parent_id: null, sort_order: 40, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001006", label: "ปริญญาตรี", href: "/programs/bachelor", type: "link", parent_id: null, sort_order: 50, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000001007", label: "ปริญญาโท", href: "/programs/master", type: "link", parent_id: null, sort_order: 60, is_active: true, is_external: false, is_core: true, location: "footer_main", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000002001", label: "ทะเบียน", href: "/students/registration", type: "link", parent_id: null, sort_order: 0, is_active: true, is_external: false, is_core: true, location: "footer_students", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000002002", label: "กยศ.", href: "https://sd.rmutt.ac.th/?page_id=2274", type: "link", parent_id: null, sort_order: 10, is_active: true, is_external: true, is_core: true, location: "footer_students", target: "_blank", description: null },
  { id: "10000000-0000-4000-8000-000000002003", label: "สวัสดิการ", href: "/students/welfare", type: "link", parent_id: null, sort_order: 20, is_active: true, is_external: false, is_core: true, location: "footer_students", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000002004", label: "ร้องเรียน/ความคิดเห็น", href: "/students/complaint", type: "link", parent_id: null, sort_order: 30, is_active: true, is_external: false, is_core: true, location: "footer_students", target: null, description: null },
  { id: "10000000-0000-4000-8000-000000002005", label: "ผลงานนักศึกษา", href: "/works/students", type: "link", parent_id: null, sort_order: 40, is_active: true, is_external: false, is_core: true, location: "footer_students", target: null, description: null },
];
