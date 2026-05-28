import type { Metadata } from "next";
import { getFinalProjectYears } from "@/lib/supabase/queries";
import FinalProjectYearsPage from "@/frontend/public/works/FinalProjectYearsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ปริญญานิพนธ์ (Thesis)",
  description: "เลือกดูปริญญานิพนธ์ (Thesis) ตามปีการศึกษา",
};

export default async function Page() {
  const years = await getFinalProjectYears().catch(() => []);
  return <FinalProjectYearsPage years={years} />;
}
