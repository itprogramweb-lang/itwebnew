import Link from "next/link";
import { ArrowRight, BookOpen, FolderSearch } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import type { CourseWorkSubject } from "@/lib/supabase/queries";

export default function CourseWorksSubjectsPage({ subjects }: { subjects: CourseWorkSubject[] }) {
  return (
    <>
      <PageHeader
        dark
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/works/students"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ผลงาน" },
              { label: "ผลงานนักศึกษา", href: "/works/students" },
              { label: "ผลงานรายวิชา" },
            ]}
          />
        }
        eyebrow="ผลงานนักศึกษา"
        title="ผลงานรายวิชา"
        description="เลือกดูผลงานตามรหัสวิชาและปีการศึกษา"
      />

      <section className="section">
        <div className="container-wide">
          {subjects.length === 0 ? (
            <div>
              <EmptyState
                title="ยังไม่มีผลงานรายวิชา"
                description="เมื่อมีการเผยแพร่ผลงานรายวิชา รายการจะแสดงในหน้านี้"
                icon={<FolderSearch className="h-7 w-7" />}
              />
              <div className="mt-6 text-center">
                <Link
                  href="/works/students"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  กลับไปผลงานนักศึกษา
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <Link key={subject.course_id} href={`/works/students/course/${encodeURIComponent(subject.course_id)}`} className="group">
                  <article
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100/70 transition group-hover:-translate-y-0.5 group-hover:border-brand-200 group-hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        มีผลงาน
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-brand-700">
                      {subject.course_id}
                    </div>
                    <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-600">
                      {subject.course_name}
                    </h2>
                    <div className="mt-4 space-y-1.5 text-sm">
                      <p>จำนวนผลงาน: {subject.work_count} รายการ</p>
                      <p>ปีการศึกษา: {subject.years.join(", ")}</p>
                    </div>
                    <div className="mt-auto pt-6">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                        ดูปีการศึกษา
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
