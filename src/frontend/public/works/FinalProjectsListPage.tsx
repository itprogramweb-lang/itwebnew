import Link from "next/link";
import { FolderSearch } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import type { StudentWorkRow } from "@/lib/supabase/queries";
import FinalProjectWorkCard from "./FinalProjectWorkCard";

export default function FinalProjectsListPage({ year, works }: { year: string; works: StudentWorkRow[] }) {
  return (
    <>
      <PageHeader
        dark
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/works/students/final-projects"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ผลงาน" },
              { label: "ผลงานนักศึกษา", href: "/works/students" },
              { label: "ปริญญานิพนธ์ (Thesis)", href: "/works/students/final-projects" },
              { label: `ปีการศึกษา ${year}` },
            ]}
          />
        }
        eyebrow={`ผลงานนักศึกษา / ปริญญานิพนธ์ (Thesis) / ${year}`}
        title={`ปริญญานิพนธ์ (Thesis) ปีการศึกษา ${year}`}
        description={`จำนวนผลงาน ${works.length} รายการ`}
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
                description="ยังไม่มีปริญญานิพนธ์ (Thesis) สำหรับปีการศึกษานี้"
                icon={<FolderSearch className="h-7 w-7" />}
              />
              <div className="mt-6 text-center">
                <Link
                  href="/works/students/final-projects"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  กลับไปเลือกปีการศึกษา
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8 xl:grid-cols-3">
              {works.map((work) => (
                <FinalProjectWorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
