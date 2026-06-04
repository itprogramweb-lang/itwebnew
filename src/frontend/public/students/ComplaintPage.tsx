import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import ComplaintForm from "@/components/forms/ComplaintForm";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";

export default async function ComplaintPage() {
  const ps = await getPageSetting("students_complaint").catch(() => null);

  const pageTitle =
    ps?.title ?? "แบบฟอร์มแจ้งข้อร้องเรียน";

  const pageDescription =
    ps?.description ??
    "สำหรับนักศึกษาและบุคคลทั่วไปที่ต้องการแจ้งข้อร้องเรียนหรือข้อเสนอแนะที่เกี่ยวข้องกับสาขาวิชา";

  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "สำหรับนักศึกษา / บุคคลทั่วไป"}
        title={pageTitle}
        description={pageDescription}
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "นักศึกษาปัจจุบัน" },
              { label: "แบบฟอร์มแจ้งข้อร้องเรียน" },
            ]}
          />
        }
      />

      {heroImageUrl && ps?.hero_layout !== "no-image" && (
        <div className="container-wide pt-8">
          <CroppedImage
            src={heroImageUrl}
            alt={ps?.hero_image_alt ?? pageTitle}
            crop={heroImageCrop}
            className="aspect-video w-full rounded-3xl border border-slate-100 bg-slate-100"
          />
        </div>
      )}

      <section className="section">
        <div className="container-wide grid gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Left menu */}
<aside className="lg:col-span-2">
  <div className="sticky top-28 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03]">
    <h2 className="text-lg font-semibold text-slate-900">
      ช่องทางร้องเรียนเพิ่มเติม
    </h2>

    <p className="mt-3 text-sm leading-relaxed text-slate-600">
      แบบฟอร์มนี้ใช้สำหรับแจ้งปัญหาหรือข้อเสนอแนะที่เกี่ยวข้องกับระดับสาขาวิชาเท่านั้น
    </p>

    <p className="mt-3 text-sm leading-relaxed text-slate-600">
      หากเป็นปัญหาระดับคณะหรือมหาวิทยาลัย สามารถคลิกเพื่อร้องเรียนโดยตรงกับทางมหาวิทยาลัยได้
    </p>

    <a
      href="http://www.suggest.rmutt.ac.th/forms.php"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
    >
      ระบบร้องเรียนของ มทร.ธัญบุรี
      <ExternalLink className="h-4 w-4" />
    </a>
  </div>
</aside>

          {/* Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/[0.03] lg:col-span-3 lg:p-8">
            <h2 className="mb-1 text-xl font-semibold text-slate-900">
              แบบฟอร์มแจ้งข้อร้องเรียน
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              กรุณากรอกรายละเอียดของเรื่องที่ต้องการแจ้งให้ชัดเจน
              ข้อมูลส่วนตัวไม่ใช่ข้อมูลบังคับ สามารถปกปิดตัวตนได้
            </p>

            <ComplaintForm />
          </div>
        </div>
      </section>
    </>
  );
}