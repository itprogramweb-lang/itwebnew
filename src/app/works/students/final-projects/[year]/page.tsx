import type { Metadata } from "next";
import { getFinalProjectsByYear } from "@/lib/supabase/queries";
import FinalProjectsListPage from "@/frontend/public/works/FinalProjectsListPage";

type Props = { params: { year: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = decodeURIComponent(params.year);
  return {
    title: `ปริญญานิพนธ์ (Thesis) ปีการศึกษา ${year}`,
    description: `ปริญญานิพนธ์ (Thesis) ปีการศึกษา ${year}`,
  };
}

export default async function Page({ params }: Props) {
  const year = decodeURIComponent(params.year);
  const works = await getFinalProjectsByYear(year).catch(() => []);

  return <FinalProjectsListPage year={year} works={works} />;
}
