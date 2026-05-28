import type { Metadata } from "next";
import LoanPage from "@/frontend/public/students/LoanPage";

export const metadata: Metadata = {
  title: "กยศ.",
  description:
    "ขั้นตอน เอกสาร และวันสำคัญสำหรับการกู้ยืม กยศ. ของนักศึกษา",
};
export const dynamic = "force-dynamic";
export default LoanPage;
