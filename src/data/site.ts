import type { SiteSettings } from "@/types";

// =============================================================
// ข้อมูลทั่วไปของเว็บไซต์
// แก้ข้อมูลจริงตรงนี้
// =============================================================
export const siteData: SiteSettings = {
  departmentName: "สาขาวิชาเทคโนโลยีคอมพิวเตอร์",
  facultyName: "คณะวิทยาศาสตร์และเทคโนโลยี",
  universityName: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี",
  shortName: "CT",
  tagline: "เรียน Computer Technology แบบลงมือจริง พร้อมก้าวสู่โลกดิจิทัล",
  address:
    "เลขที่ 39 หมู่ 1 ถนนรังสิต-นครนายก ตำบลคลองหก อำเภอธัญบุรี จังหวัดปทุมธานี 12110",
  phone: "0-2549-4167",
  email: "itprogram.web@gmail.com",
  facebook: "https://facebook.com/",
  line: "@rmutt-it",
  workingHours: "จันทร์ - ศุกร์ เวลา 08:30 - 16:30 น.",
  themeColor: "orange",
};

// ข้อมูลสไลด์หน้าแรก แยกไว้เพื่อย้ายไป Supabase ได้ง่ายในรอบต่อไป
export const heroSlides = [
  {
    id: "admission-2568",
    eyebrow: "เปิดรับสมัครนักศึกษาใหม่",
    title: "ก้าวสู่สายเทคโนโลยีสารสนเทศกับ RMUTT",
    description:
      "หลักสูตรที่เน้นการเรียนรู้จากงานจริง เชื่อมโยงเทคโนโลยี ธุรกิจ และการสร้างนวัตกรรมสำหรับอนาคต",
    primaryLabel: "สมัครเรียน",
    primaryHref: "/apply",
    secondaryLabel: "ดูหลักสูตร",
    secondaryHref: "/programs/bachelor",
    gradient:
      "bg-[linear-gradient(135deg,#020617_0%,#0f172a_45%,#9a3412_100%)]",
    imageUrl: "/placeholders/hero-1.svg",
  },
  {
    id: "student-work",
    eyebrow: "ผลงานและนวัตกรรม",
    title: "สร้างผลงานจริงตั้งแต่ในห้องเรียน",
    description:
      "นักศึกษาได้ฝึกคิด วิเคราะห์ ออกแบบ และพัฒนาระบบจริง เพื่อเตรียมพร้อมต่อการทำงานในอุตสาหกรรมดิจิทัล",
    primaryLabel: "ชมผลงานนักศึกษา",
    primaryHref: "/works/students",
    secondaryLabel: "เกี่ยวกับสาขา",
    secondaryHref: "/about",
    gradient:
      "bg-[linear-gradient(135deg,#030712_0%,#172554_52%,#ea580c_100%)]",
    imageUrl: "/placeholders/hero-2.svg",
  },
  {
    id: "contact",
    eyebrow: "คณะวิทยาศาสตร์และเทคโนโลยี",
    title: "เรียนใกล้ทีมผู้สอน พร้อมเครือข่ายมหาวิทยาลัย",
    description:
      "พื้นที่การเรียนรู้สำหรับคนรุ่นใหม่ที่ต้องการพัฒนาทักษะด้านซอฟต์แวร์ ข้อมูล เครือข่าย และระบบดิจิทัล",
    primaryLabel: "ติดต่อสอบถาม",
    primaryHref: "/about/contact",
    secondaryLabel: "ดูบุคลากร",
    secondaryHref: "/about/staff",
    gradient:
      "bg-[linear-gradient(135deg,#111827_0%,#1e293b_46%,#c2410c_100%)]",
    imageUrl: "/placeholders/hero-3.svg",
  },
  {
    id: "programs",
    eyebrow: "หลักสูตรเทคโนโลยีสารสนเทศ",
    title: "เลือกเส้นทางเรียนที่ต่อยอดสู่สายงานดิจิทัล",
    description:
      "สำรวจหลักสูตรและแนวทางการเรียนที่ช่วยวางพื้นฐานด้านซอฟต์แวร์ ข้อมูล เครือข่าย และการออกแบบระบบ",
    primaryLabel: "ดูหลักสูตร",
    primaryHref: "/programs/bachelor",
    secondaryLabel: "สมัครเรียน",
    secondaryHref: "/apply",
    gradient:
      "bg-[linear-gradient(135deg,#020617_0%,#334155_48%,#f97316_100%)]",
    imageUrl: "/placeholders/hero-4.svg",
  },
];

// สถิติประจำสาขา
export const siteStats = [
  { label: "นักศึกษาปัจจุบัน", value: "240" },
  { label: "ศิษย์เก่า", value: "รอข้อมูล" },
  { label: "อาจารย์ประจำ", value: "8 " },
  { label: "ห้องปฏิบัติการ", value: "6" },
];
