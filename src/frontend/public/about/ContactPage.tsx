import { Phone, MapPin, Clock, Map } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import { siteData } from "@/data/site";
import CroppedImage from "@/components/ui/CroppedImage";
import { getPageSetting } from "@/lib/supabase/queries";

const contactItems = [
  {
    icon: <MapPin className="w-5 h-5" />,
    label: "ที่อยู่",
    value: siteData.address,
  },
  {
    icon: <Phone className="w-5 h-5" />,
    label: "เบอร์โทร",
    value: "0-2549-4167",
    href: "tel:025494167",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    label: "เวลาทำการ",
    value: siteData.workingHours,
  },
];

export default async function ContactPage() {
  const ps = await getPageSetting("contact").catch(() => null);

  const pageTitle = ps?.title ?? "คุยกับเราได้ทุกช่องทาง";
  const pageDescription =
    ps?.description ??
    "มีคำถามเรื่องสมัครเรียน หลักสูตร หรือเรื่องอื่น ๆ? ทีมงานของเราพร้อมตอบทุกข้อสงสัย";

  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;

  return (
    <>
      <PageHeader
        dark
        eyebrow={ps?.subtitle ?? "ติดต่อเรา"}
        title={pageTitle}
        description={pageDescription}
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "เกี่ยวกับสาขา", href: "/about" },
              { label: "ติดต่อ" },
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
            className="aspect-video w-full rounded-3xl border border-slate-100 bg-slate-100 shadow-sm"
          />
        </div>
      )}

      <section className="section">
        <div className="container-wide">
          <div className="mb-8 max-w-2xl">
            <div className="mb-3 inline-flex rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600">
              ช่องทางการติดต่อ
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              ติดต่อสาขาเทคโนโลยีสารสนเทศและการสื่อสารดิจิทัล
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              สามารถติดต่อสอบถามข้อมูลเกี่ยวกับหลักสูตร การสมัครเรียน
              หรือข้อมูลทั่วไปของสาขาได้ผ่านช่องทางด้านล่าง
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5 lg:items-stretch">
            {/* Contact Cards */}
            <div className="space-y-4 lg:col-span-2">
              {contactItems.map((c) => {
                const content = (
                  <div className="group flex h-full items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/[0.03] transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/10">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white shadow-brand transition group-hover:scale-105">
                      {c.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 text-sm font-semibold text-slate-900">
                        {c.label}
                      </div>

                      <div className="text-sm font-medium leading-relaxed text-slate-700 break-words">
                        {c.value}
                      </div>
                    </div>
                  </div>
                );

                return c.href ? (
                  <a key={c.label} href={c.href} className="block">
                    {content}
                  </a>
                ) : (
                  <div key={c.label}>{content}</div>
                );
              })}
            </div>

            {/* Location แบบเดิม แต่อยู่ข้าง ๆ Card */}
  <div className="lg:col-span-3">
    <div className="h-full min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03]">
      <iframe
        title="แผนที่สาขาเทคโนโลยีสารสนเทศและการสื่อสารดิจิทัล"
        src="https://www.google.com/maps?q=คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี&output=embed"
        className="h-full min-h-[320px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  </div>
          </div>
        </div>
      </section>
    </>
  );
}
