import type { Metadata } from "next";
import StudentWorksLandingPage from "@/frontend/public/works/StudentWorksLandingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ผลงานนักศึกษา",
  description: "ผลงานรายวิชา ปริญญานิพนธ์ (Thesis) และผลงานประกวด แข่งขัน หรือนำเสนอผลงานของนักศึกษา",
};

export default StudentWorksLandingPage;
