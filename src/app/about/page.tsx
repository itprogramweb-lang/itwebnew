import type { Metadata } from "next";
import AboutPage from "@/frontend/public/about/AboutPage";

export const metadata: Metadata = {
  title: "เกี่ยวกับสาขา",
  description:
    "ประวัติ วิสัยทัศน์ พันธกิจ จุดเด่นและบรรยากาศการเรียนของสาขาเทคโนโลยีสารสนเทศ RMUTT",
};
export const dynamic = "force-dynamic";
export default AboutPage;
