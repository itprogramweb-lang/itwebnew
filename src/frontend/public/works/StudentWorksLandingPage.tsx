import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { PageHeader } from "@/components/ui/primitives";

const items = [
  {
    title: "ผลงานรายวิชา",
    description: "เลือกดูผลงานตามรหัสวิชาและปีการศึกษา",
    href: "/works/students/course",
    icon: BookOpen,
  },
  {
    title: "ปริญญานิพนธ์ (Thesis)",
    description: "เลือกดูปริญญานิพนธ์ (Thesis) ตามปีการศึกษา",
    href: "/works/students/final-projects",
    icon: GraduationCap,
  },
];

export default function StudentWorksLandingPage() {
  return (
    <>
      <PageHeader
        dark
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ผลงาน" },
              { label: "ผลงานนักศึกษา" },
            ]}
          />
        }
        eyebrow="ผลงานนักศึกษา"
        title="ผลงานนักศึกษา"
        description="เลือกดูผลงานรายวิชาและปริญญานิพนธ์ (Thesis) ของนักศึกษาตามหมวดหมู่"
      />

      <section className="section">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <article className="h-full rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 card-hover">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                      เข้าดูรายการ
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
