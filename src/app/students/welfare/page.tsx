import type { Metadata } from "next";
import WelfarePage from "@/frontend/public/students/WelfarePage";

export const metadata: Metadata = {
  title: "สวัสดิการนักศึกษา",
  description:
    "ทุนการศึกษา ห้องปฏิบัติการ บริการให้คำปรึกษา และสิ่งอำนวยความสะดวกสำหรับนักศึกษา",
};
export const dynamic = "force-dynamic";
export default WelfarePage;
