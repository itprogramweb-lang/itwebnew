import { Award, FolderSearch } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import { getStudentWorks } from "@/lib/supabase/queries";
import { STUDENT_WORK_TYPE_COMPETITION } from "@/lib/studentWorkTypes";
import StudentWorkCard from "./StudentWorkCard";

export default async function CompetitionWorksPage() {
  const works = (await getStudentWorks()).filter(
    (work) => work.work_type === STUDENT_WORK_TYPE_COMPETITION
  );

  return (
    <>
      <PageHeader
        dark
        eyebrow="ผลงานนักศึกษา"
        title="ประกวด / แข่งขัน / นำเสนอผลงาน"
        description="ผลงานจากเวทีประกวด การแข่งขัน และการนำเสนอผลงานของนักศึกษา"
      />

      <section className="section">
        <div className="container-wide">
          {works.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <FolderSearch className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">
                ยังไม่มีผลงานประกวด / แข่งขัน / นำเสนอผลงานในขณะนี้
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {works.map((work) => (
                <StudentWorkCard key={work.id} work={work} />
              ))}
            </div>
          )}

          <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
            <Award className="h-4 w-4" />
            ประกวด / แข่งขัน / นำเสนอผลงาน
          </div>
        </div>
      </section>
    </>
  );
}

