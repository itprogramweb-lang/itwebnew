import type { Metadata } from "next";
import StudentWorksLandingPage from "@/frontend/public/works/StudentWorksLandingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ผลงานนักศึกษา",
  description: "ผลงานรายวิชาและปริญญานิพนธ์ (Thesis) ของนักศึกษา",
};

export default StudentWorksLandingPage;
