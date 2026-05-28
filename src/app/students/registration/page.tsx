import type { Metadata } from "next";
import RegistrationPage from "@/frontend/public/students/RegistrationPage";

export const metadata: Metadata = {
  title: "ทะเบียน",
  description:
    "ลิงก์และข้อมูลสำหรับนักศึกษาเกี่ยวกับการลงทะเบียน เพิ่ม-ถอนรายวิชา ตรวจสอบผลการเรียน คำร้องออนไลน์",
};
export const dynamic = "force-dynamic";
export default RegistrationPage;
