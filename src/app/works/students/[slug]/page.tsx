import type { Metadata } from "next";
import { getStudentWorkBySlug } from "@/lib/supabase/queries";
import StudentWorkDetailPage from "@/frontend/public/works/StudentWorkDetailPage";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const work = await getStudentWorkBySlug(params.slug).catch(() => null);
  if (!work) return { title: "ไม่พบผลงาน" };
  return {
    title: work.title,
    description: work.description ?? undefined,
  };
}

export default function Page(props: Props) {
  return <StudentWorkDetailPage {...props} />;
}
