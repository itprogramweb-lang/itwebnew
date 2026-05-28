import type { Metadata } from "next";
import FeedbackPage from "@/frontend/public/students/FeedbackPage";

export const metadata: Metadata = {
  title: "ความคิดเห็น / ข้อเสนอแนะ",
  description: "แสดงความคิดเห็นและข้อเสนอแนะเพื่อพัฒนาการเรียนการสอนและบริการของสาขา",
};
export const dynamic = "force-dynamic";
export default FeedbackPage;
