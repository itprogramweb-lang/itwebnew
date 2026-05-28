import Link from "next/link";
import { FolderSearch } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import type { StudentWorkRow } from "@/lib/supabase/queries";
import CourseWorkCard from "./CourseWorkCard";

type Props = {
  courseId: string;
  year: string;
  works: StudentWorkRow[];
};

export default function CourseWorksListPage({ courseId, year, works }: Props) {
  const courseName = works.find((work) => work.course_name)?.course_name ?? null;
  const courseHref = `/works/students/course/${encodeURIComponent(courseId)}`;

  return (
    <>
      <PageHeader
        dark
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref={courseHref}
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ผลงาน" },
              { label: "ผลงานนักศึกษา", href: "/works/students" },
              { label: "ผลงานรายวิชา", href: "/works/students/course" },
              { label: courseName ?? courseId, href: courseHref },
              { label: `ปีการศึกษา ${year}` },
            ]}
          />
        }
        eyebrow={`ผลงานนักศึกษา / ผลงานรายวิชา / ${courseId} / ${year}`}
        title={`ผลงานรายวิชา: ${courseId}${courseName ? ` ${courseName}` : ""}`}
        description={`ปีการศึกษา ${year}`}
      />

      <section className="section">
        <div className="container-wide">
          <div className="mb-6 flex flex-wrap items-center justify-end gap-4">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              จำนวนผลงาน {works.length} รายการ
            </div>
          </div>

          {works.length === 0 ? (
            <div>
              <EmptyState
                title="ยังไม่มีข้อมูล"
                description="ยังไม่มีผลงานสำหรับรายวิชาและปีการศึกษานี้"
                icon={<FolderSearch className="h-7 w-7" />}
              />
              <div className="mt-6 text-center">
                <Link
                  href={courseHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  กลับไปเลือกปีการศึกษา
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8 xl:grid-cols-3">
              {works.map((work) => (
                <CourseWorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
