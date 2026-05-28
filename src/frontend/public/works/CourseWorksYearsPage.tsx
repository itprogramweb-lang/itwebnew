import Link from "next/link";
import { ArrowRight, CalendarDays, FolderSearch } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import type { CourseWorkSubject, CourseWorkYear } from "@/lib/supabase/queries";

type Props = {
  courseId: string;
  subject: CourseWorkSubject | null;
  years: CourseWorkYear[];
};

export default function CourseWorksYearsPage({ courseId, subject, years }: Props) {
  const courseName = subject?.course_name ?? null;
  const currentLabel = courseName ?? courseId;

  return (
    <>
      <PageHeader
        dark
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/works/students/course"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ผลงาน" },
              { label: "ผลงานนักศึกษา", href: "/works/students" },
              { label: "ผลงานรายวิชา", href: "/works/students/course" },
              { label: currentLabel },
            ]}
          />
        }
        eyebrow="ผลงานนักศึกษา / ผลงานรายวิชา / รหัสวิชา"
        title={courseName ?? "ผลงานรายวิชา"}
        description={`รหัสวิชา ${courseId} / เลือกปีการศึกษาที่ต้องการดูผลงาน`}
      />

      <section className="section">
        <div className="container-wide">
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100/70">
            <p className="text-xs font-medium text-slate-500">ผลงานนักศึกษา / ผลงานรายวิชา / {courseId}</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              {courseName ?? "ผลงานรายวิชา"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">รหัสวิชา {courseId}</p>
            <p className="mt-2 text-sm text-slate-600">
              {years.length > 0 ? `มีผลงานเผยแพร่ ${years.length} ปีการศึกษา` : "ยังไม่มีผลงานสำหรับรายวิชานี้"}
            </p>
          </div>

          {!subject || years.length === 0 ? (
            <div>
              <EmptyState
                title="ยังไม่มีข้อมูล"
                description="ไม่พบปีการศึกษาสำหรับรายวิชานี้"
                icon={<FolderSearch className="h-7 w-7" />}
              />
              <div className="mt-6 text-center">
                <Link
                  href="/works/students/course"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  กลับไปรายวิชา
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {years.map((year) => (
                <Link key={year.academic_year} href={`/works/students/course/${encodeURIComponent(courseId)}/${encodeURIComponent(year.academic_year)}`} className="group">
                  <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100/70 transition group-hover:-translate-y-0.5 group-hover:border-brand-200 group-hover:shadow-lg">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">ปีการศึกษา {year.academic_year}</h2>
                    <p className="mt-2 text-sm text-slate-600">{courseName ?? `รหัสวิชา ${courseId}`}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      อาจารย์ผู้สอน: {year.advisor_names.length > 0 ? year.advisor_names.join(", ") : "ยังไม่ระบุ"}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                      ดูผลงาน
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
