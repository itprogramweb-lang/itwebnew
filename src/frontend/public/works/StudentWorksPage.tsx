import Link from "next/link";
import { ArrowRight, FolderSearch, GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import CroppedImage from "@/components/ui/CroppedImage";
import { getStudentWorks } from "@/lib/supabase/queries";
import { getStudentWorkTypeLabel } from "@/lib/studentWorkTypes";

const workFallback = "/placeholders/student-work-placeholder.svg";

export default async function StudentWorksPage() {
  const works = await getStudentWorks();

  return (
    <>
      <PageHeader
        dark
        eyebrow="โปรเจกต์นักศึกษา"
        title="ผลงานนักศึกษา"
        description="รวมผลงานรายวิชา ปริญญานิพนธ์ (Thesis) และผลงานประกวด แข่งขัน หรือนำเสนอผลงานของนักศึกษา"
      />

      <section className="section">
        <div className="container-wide">
          {works.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-200">
              <FolderSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูลในขณะนี้</p>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {works.map((work) => {
                const workHref = work.slug
                  ? `/works/students/${work.slug}`
                  : work.external_url && work.external_url !== "#"
                  ? work.external_url
                  : null;
                const isExternal = !work.slug && !!workHref;
                const card = (
                  <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white card-hover h-full flex flex-col">
                    <CroppedImage
                      src={work.image_url}
                      fallbackSrc={workFallback}
                      alt={work.image_alt || work.title}
                      crop={work.image_crop_settings}
                      className="h-44 w-full rounded-none bg-slate-100 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                          {getStudentWorkTypeLabel(work.work_type)}
                        </span>
                        {work.category && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            {work.category}
                          </span>
                        )}
                        {work.academic_year && (
                          <span className="text-slate-500">{work.academic_year}</span>
                        )}
                      </div>
                      <h2 className="mt-3 font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
                        {work.title}
                      </h2>
                      {work.description && (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {work.description}
                        </p>
                      )}
                      <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                        {(work.students ?? []).length > 0 && (
                          <div className="flex gap-2">
                            <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{(work.students ?? []).join(", ")}</span>
                          </div>
                        )}
                        {work.advisor_name && (
                          <div className="flex gap-2">
                            <GraduationCap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>ที่ปรึกษา: {work.advisor_name}</span>
                          </div>
                        )}
                      </div>
                      {(work.technologies ?? []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(work.technologies ?? []).slice(0, 4).map((item) => (
                            <span key={item} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                      {workHref && (
                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-end">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 group-hover:text-brand-700">
                            ดูรายละเอียด <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
                return workHref ? (
                  <Link key={work.id} href={workHref} target={isExternal ? "_blank" : undefined} className="flex flex-col">
                    {card}
                  </Link>
                ) : (
                  <div key={work.id}>{card}</div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
