import type { Metadata } from "next";
import ContactPage from "@/frontend/public/about/ContactPage";

export const metadata: Metadata = {
  title: "ติดต่อสาขา",
  description: "ที่อยู่ เบอร์โทร อีเมล และช่องทางการติดต่อสาขาเทคโนโลยีสารสนเทศ RMUTT",
};
export const dynamic = "force-dynamic";
export default ContactPage;
