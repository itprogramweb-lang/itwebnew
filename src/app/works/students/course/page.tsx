import type { Metadata } from "next";
import { getCourseWorkSubjects } from "@/lib/supabase/queries";
import CourseWorksSubjectsPage from "@/frontend/public/works/CourseWorksSubjectsPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ผลงานรายวิชา",
  description: "เลือกดูผลงานรายวิชาตามรหัสวิชาและปีการศึกษา",
};

export default async function Page() {
  const subjects = await getCourseWorkSubjects().catch(() => []);
  return <CourseWorksSubjectsPage subjects={subjects} />;
}
