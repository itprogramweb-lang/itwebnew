import type { Metadata } from "next";
import ComplaintPage from "@/frontend/public/students/ComplaintPage";

export const metadata: Metadata = {
  title: "ร้องเรียน / ความคิดเห็น",
  description:
    "ส่งข้อร้องเรียน เสนอแนะ หรือแสดงความคิดเห็นเกี่ยวกับการให้บริการ การเรียน หรือบุคลากรของสาขา",
};

export const dynamic = "force-dynamic";

export default ComplaintPage;
