import type { Metadata } from "next";
import { getCourseWorksByYear } from "@/lib/supabase/queries";
import CourseWorksListPage from "@/frontend/public/works/CourseWorksListPage";

type Props = { params: { courseId: string; year: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const courseId = decodeURIComponent(params.courseId);
  const year = decodeURIComponent(params.year);
  return {
    title: `ผลงานรายวิชา ${courseId} ปีการศึกษา ${year}`,
    description: `ผลงานรายวิชา ${courseId} ปีการศึกษา ${year}`,
  };
}

export default async function Page({ params }: Props) {
  const courseId = decodeURIComponent(params.courseId);
  const year = decodeURIComponent(params.year);
  const works = await getCourseWorksByYear(courseId, year).catch(() => []);

  return <CourseWorksListPage courseId={courseId} year={year} works={works} />;
}
