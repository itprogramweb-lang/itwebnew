export type PermissionLabelMeta = {
  labelTh: string;
  descriptionTh: string;
  groupTh: string;
  shortLabelTh?: string;
};

export type PermissionDisplayGroup = {
  title: string;
  permissions: string[];
};

const GROUP_ORDER = [
  "ภาพรวมและโปรไฟล์",
  "ผู้ใช้งาน / สิทธิ์",
  "เนื้อหาเว็บไซต์",
  "หลักสูตร / รายวิชา",
  "ผลงาน",
  "หน้าเว็บ / เมนู / ตั้งค่า",
  "ข้อร้องเรียน",
  "งานนักศึกษา",
  "อื่น ๆ",
];

const permissionLabelMap: Record<string, PermissionLabelMeta> = {
  view_dashboard: {
    labelTh: "ภาพรวม",
    descriptionTh: "เข้าใช้งานหน้าแดชบอร์ดหลังบ้าน",
    groupTh: "ภาพรวมและโปรไฟล์",
  },
  view_own_profile: {
    labelTh: "โปรไฟล์ของตัวเอง",
    descriptionTh: "ดูและจัดการข้อมูลโปรไฟล์ของตัวเอง",
    groupTh: "ภาพรวมและโปรไฟล์",
  },
  manage_users: {
    labelTh: "ผู้ใช้งาน",
    descriptionTh: "เพิ่ม แก้ไข ปิดใช้งาน และจัดการผู้ใช้",
    groupTh: "ผู้ใช้งาน / สิทธิ์",
  },
  manage_permissions: {
    labelTh: "จัดการสิทธิ์ผู้ใช้",
    descriptionTh: "กำหนดสิทธิ์แบบกำหนดเองให้ผู้ใช้แต่ละคน",
    groupTh: "ผู้ใช้งาน / สิทธิ์",
  },
  manage_hero_slides: {
    labelTh: "สไลด์หน้าแรก",
    descriptionTh: "จัดการรูปภาพและข้อความสไลด์หน้าแรก",
    groupTh: "เนื้อหาเว็บไซต์",
  },
  manage_news: {
    labelTh: "ข่าว/ประกาศ",
    descriptionTh: "เพิ่ม แก้ไข เผยแพร่ และจัดการข่าวประกาศ",
    groupTh: "เนื้อหาเว็บไซต์",
  },
  manage_staff: {
    labelTh: "บุคลากร",
    descriptionTh: "จัดการข้อมูลบุคลากรและอาจารย์",
    groupTh: "เนื้อหาเว็บไซต์",
  },
  manage_programs: {
    labelTh: "หลักสูตร",
    descriptionTh: "จัดการข้อมูลหลักสูตร",
    groupTh: "หลักสูตร / รายวิชา",
  },
  manage_works: {
    labelTh: "ผลงานทั้งหมด",
    descriptionTh: "จัดการภาพรวมของผลงานในระบบ",
    groupTh: "ผลงาน",
  },
  manage_student_works: {
    labelTh: "ผลงานนักศึกษา",
    descriptionTh: "จัดการปริญญานิพนธ์และผลงานรายวิชา",
    groupTh: "ผลงาน",
  },
  edit_advised_student_works: {
    labelTh: "แก้ไขผลงานนักศึกษาที่เป็นที่ปรึกษา",
    descriptionTh: "ให้อาจารย์แก้ไขเฉพาะผลงานที่ตนเองเป็นที่ปรึกษา",
    groupTh: "ผลงาน",
  },
  manage_teacher_works: {
    labelTh: "ผลงานอาจารย์",
    descriptionTh: "จัดการผลงานอาจารย์ทั้งหมด",
    groupTh: "ผลงาน",
  },
  edit_own_teacher_works: {
    labelTh: "แก้ไขผลงานอาจารย์ของตัวเอง",
    descriptionTh: "ให้อาจารย์แก้ไขเฉพาะผลงานของตัวเอง",
    groupTh: "ผลงาน",
  },
  manage_pages: {
    labelTh: "จัดการหน้าเว็บและเมนู",
    descriptionTh: "จัดการการแสดงผลหน้าเว็บ เมนู และข้อมูลหน้าหลัก",
    groupTh: "หน้าเว็บ / เมนู / ตั้งค่า",
  },
  manage_settings: {
    labelTh: "ตั้งค่าเว็บไซต์ / ปรับธีม",
    descriptionTh: "จัดการข้อมูลสาขา โลโก้ ช่องทางติดต่อ Branding และธีมเว็บไซต์",
    groupTh: "หน้าเว็บ / เมนู / ตั้งค่า",
  },
  manage_complaints: {
    labelTh: "ข้อร้องเรียน",
    descriptionTh: "ดูและจัดการข้อร้องเรียน",
    groupTh: "ข้อร้องเรียน",
  },
  view_complaints: {
    labelTh: "ดูข้อร้องเรียน",
    descriptionTh: "ดูรายการข้อร้องเรียนตามสิทธิ์",
    groupTh: "ข้อร้องเรียน",
  },
  view_all_complaints: {
    labelTh: "ดูข้อร้องเรียนทั้งหมด",
    descriptionTh: "ดูข้อร้องเรียนทั้งหมดในระบบ",
    groupTh: "ข้อร้องเรียน",
  },
  view_own_complaints: {
    labelTh: "ดูข้อร้องเรียนที่เกี่ยวข้อง",
    descriptionTh: "ดูข้อร้องเรียนที่เกี่ยวข้องกับตนเองหรือหน่วยงาน",
    groupTh: "ข้อร้องเรียน",
  },
  change_complaint_status_all: {
    labelTh: "เปลี่ยนสถานะข้อร้องเรียนทั้งหมด",
    descriptionTh: "เปลี่ยนสถานะข้อร้องเรียนได้ทุกประเภท",
    groupTh: "ข้อร้องเรียน",
  },
  change_complaint_status_partial: {
    labelTh: "เปลี่ยนสถานะข้อร้องเรียนบางส่วน",
    descriptionTh: "เปลี่ยนสถานะข้อร้องเรียนเฉพาะส่วนที่ได้รับอนุญาต",
    groupTh: "ข้อร้องเรียน",
  },
  manage_registration: {
    labelTh: "งานทะเบียน",
    descriptionTh: "จัดการข้อมูลงานทะเบียนนักศึกษา",
    groupTh: "งานนักศึกษา",
  },
  manage_loan: {
    labelTh: "กยศ.",
    descriptionTh: "จัดการข้อมูลกองทุนเงินให้กู้ยืมเพื่อการศึกษา",
    groupTh: "งานนักศึกษา",
  },
  manage_welfare: {
    labelTh: "สวัสดิการนักศึกษา",
    descriptionTh: "จัดการข้อมูลสวัสดิการนักศึกษา",
    groupTh: "งานนักศึกษา",
  },
};

function humanizePermissionKey(permission: string) {
  return permission
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getPermissionLabelMeta(permission: string): PermissionLabelMeta {
  return (
    permissionLabelMap[permission] ?? {
      labelTh: humanizePermissionKey(permission),
      descriptionTh: "สิทธิ์ภายในระบบ",
      groupTh: "อื่น ๆ",
    }
  );
}

export function groupPermissionsForDisplay(permissions: string[]): PermissionDisplayGroup[] {
  const grouped = new Map<string, string[]>();

  for (const permission of permissions) {
    const meta = getPermissionLabelMeta(permission);
    grouped.set(meta.groupTh, [...(grouped.get(meta.groupTh) ?? []), permission]);
  }

  return GROUP_ORDER.flatMap((title) => {
    const groupPermissions = grouped.get(title) ?? [];
    return groupPermissions.length > 0 ? [{ title, permissions: groupPermissions }] : [];
  });
}
