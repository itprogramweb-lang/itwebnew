import type { Metadata } from "next";
import ApplyPage from "@/frontend/public/apply/ApplyPage";

export const metadata: Metadata = {
  title: "สมัครเรียน",
  description:
    "ขั้นตอนและวิธีสมัครเรียน คุณสมบัติผู้สมัคร เอกสาร และค่าใช้จ่ายสำหรับการสมัครเรียนสาขาเทคโนโลยีสารสนเทศ RMUTT",
};
export const dynamic = "force-dynamic";
export default ApplyPage;
