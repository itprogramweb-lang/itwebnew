import type {
  Complaint,
  ComplaintStatus,
  ComplaintType,
} from "@/types";

// =============================================================
// ข้อมูลข้อร้องเรียน/ความคิดเห็น (จำลอง)
// แก้ข้อมูลจริงตรงนี้
// ในระบบจริง: เก็บใน database + role-based access
// =============================================================
export const complaintsData: Complaint[] = [
  {
    id: "c001",
    refNo: "CMP-2024-0001",
    type: "study",
    subject: "ขอความช่วยเหลือเรื่องตารางสอน",
    detail: "ตารางสอนภาคนี้มีวิชาชนกันสองวิชา ต้องการปรึกษาเรื่องการลงทะเบียน",
    name: "ปกปิด",
    studentId: "1xxxxx101",
    email: "student01@example.com",
    wantsCallback: true,
    status: "in_progress",
    assignee: "นางสาว วรัญญา ใจดี",
    createdAt: "2024-11-12T10:30:00",
    notes: [
      {
        author: "admin",
        at: "2024-11-12T11:00:00",
        text: "ติดต่อนักศึกษาแล้ว แจ้งให้พบอาจารย์ที่ปรึกษา",
      },
    ],
  },
  {
    id: "c002",
    refNo: "CMP-2024-0002",
    type: "system",
    subject: "เว็บไซต์โหลดช้าตอนช่วงเย็น",
    detail: "ช่วง 18:00 - 20:00 เว็บไซต์โหลดช้ามาก เปิดหน้าทะเบียนไม่ได้",
    wantsCallback: false,
    status: "resolved",
    createdAt: "2024-11-10T18:30:00",
    notes: [
      {
        author: "staff",
        at: "2024-11-11T09:00:00",
        text: "ตรวจสอบ Server แล้ว ปรับ resource เรียบร้อย",
      },
    ],
  },
  {
    id: "c003",
    refNo: "CMP-2024-0003",
    type: "suggestion",
    subject: "ข้อเสนอเพิ่มห้อง Co-working",
    detail: "อยากให้สาขาเพิ่มพื้นที่ Co-working สำหรับนักศึกษาทำโปรเจกต์",
    name: "นายปกป้อง",
    studentId: "1xxxxx203",
    wantsCallback: false,
    status: "new",
    createdAt: "2024-11-15T14:20:00",
  },
  {
    id: "c004",
    refNo: "CMP-2024-0004",
    type: "complaint",
    subject: "บริการเคาน์เตอร์ทะเบียน",
    detail: "ใช้บริการแล้วรู้สึกว่าควรปรับปรุงเรื่องเวลาเปิด-ปิด",
    wantsCallback: false,
    status: "in_progress",
    assignee: "นางสาว วรัญญา ใจดี",
    createdAt: "2024-11-08T13:45:00",
  },
  {
    id: "c005",
    refNo: "CMP-2024-0005",
    type: "other",
    subject: "สอบถามเรื่องทุนการศึกษา",
    detail: "อยากทราบรายละเอียดทุนเรียนดีปีหน้าเปิดเมื่อไร",
    name: "นางสาวอินทิรา",
    email: "intira@example.com",
    wantsCallback: true,
    status: "rejected",
    createdAt: "2024-11-01T09:10:00",
    notes: [
      {
        author: "admin",
        at: "2024-11-01T10:00:00",
        text: "ไม่ใช่เรื่องร้องเรียน ส่งต่อให้ฝ่ายทุนตอบโดยตรง",
      },
    ],
  },
];

export const complaintTypeLabels: Record<ComplaintType, string> = {
  complaint: "ร้องเรียน",
  suggestion: "เสนอแนะ",
  study: "ปัญหาการเรียน",
  people: "ปัญหาบุคลากร",
  system: "ปัญหาระบบ/เว็บไซต์",
  other: "อื่น ๆ",
};

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  new: "ใหม่",
  in_progress: "กำลังดำเนินการ",
  resolved: "ดำเนินการแล้ว",
  rejected: "ไม่ดำเนินการ",
};
