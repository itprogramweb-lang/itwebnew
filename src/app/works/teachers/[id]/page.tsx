import { getTeacherWorkById } from "@/lib/supabase/queries";
import TeacherWorkDetailPage from "@/frontend/public/works/TeacherWorkDetailPage";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props) {
  const work = await getTeacherWorkById(params.id).catch(() => null);
  return {
    title: work ? `${work.title} | ผลงานอาจารย์` : "ผลงานอาจารย์",
    description: work?.description ?? "รายละเอียดผลงานอาจารย์ สาขาเทคโนโลยีสารสนเทศ RMUTT",
  };
}

export default function Page(props: Props) {
  return <TeacherWorkDetailPage {...props} />;
}
