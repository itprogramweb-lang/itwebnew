import Link from "next/link";
import { ArrowRight, CalendarDays, FolderSearch } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { EmptyState, PageHeader } from "@/components/ui/primitives";

export default function FinalProjectYearsPage({ years }: { years: string[] }) {
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
              { label: "ปริญญานิพนธ์ (Thesis)" },
            ]}
          />
        }
        eyebrow="ผลงานนักศึกษา"
        title="ปริญญานิพนธ์ (Thesis)"
        description="เลือกดูปริญญานิพนธ์ (Thesis) ตามปีการศึกษา"
      />

      <section className="section">
        <div className="container-wide">
          {years.length === 0 ? (
            <div>
              <EmptyState
                title="ยังไม่มีปริญญานิพนธ์ (Thesis)"
                description="เมื่อมีการเผยแพร่ปริญญานิพนธ์ (Thesis) รายการจะแสดงในหน้านี้"
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {years.map((year) => (
                <Link key={year} href={`/works/students/final-projects/${encodeURIComponent(year)}`} className="group">
                  <article className="rounded-3xl border border-slate-200 bg-white p-6 card-hover">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">ปีการศึกษา {year}</h2>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                      ดูปริญญานิพนธ์ (Thesis)
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
