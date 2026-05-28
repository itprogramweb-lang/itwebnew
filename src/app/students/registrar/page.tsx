import type { Metadata } from "next";
import RegistrarPage from "@/frontend/public/students/RegistrarPage";

export const metadata: Metadata = {
  title: "งานทะเบียน",
  description: "ข้อมูลงานทะเบียน ลงทะเบียนเรียน คำร้อง และช่องทางติดต่อ",
};
export const dynamic = "force-dynamic";
export default RegistrarPage;
