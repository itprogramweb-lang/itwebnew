import type { Metadata } from "next";
import { getCourseWorkSubjects, getCourseWorkYears } from "@/lib/supabase/queries";
import CourseWorksYearsPage from "@/frontend/public/works/CourseWorksYearsPage";

type Props = { params: { courseId: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const courseId = decodeURIComponent(params.courseId);
  return {
    title: `ผลงานรายวิชา ${courseId}`,
    description: `ปีการศึกษาของผลงานรายวิชา ${courseId}`,
  };
}

export default async function Page({ params }: Props) {
  const courseId = decodeURIComponent(params.courseId);
  const [subjects, years] = await Promise.all([
    getCourseWorkSubjects().catch(() => []),
    getCourseWorkYears(courseId).catch(() => []),
  ]);
  const subject = subjects.find((item) => item.course_id === courseId) ?? null;

  return <CourseWorksYearsPage courseId={courseId} subject={subject} years={years} />;
}
