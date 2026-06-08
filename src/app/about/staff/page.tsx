import { Mail, MapPin, Phone, Users } from "lucide-react";
import CroppedImage from "@/components/ui/CroppedImage";
import { getStaffMembers, getPageSetting } from "@/lib/supabase/queries";
import { sortStaffMembersWithDepartmentHeadFirst } from "@/lib/staffOrdering";
// 🛠️ ดึง PageHero ชิ้นงานกลางเข้ามาคุมระบบแบนเนอร์ แสงสีส้ม และ Breadcrumb แทน PageHeader ตัวเก่า
import PageHero from "@/components/ui/PageHero";

export const dynamic = "force-dynamic";

const staffFallback = "/placeholders/staff-placeholder.svg";
const ROLE_LABELS: Record<string, string> = {
  executive: "หัวหน้าสาขา",
  teacher: "อาจารย์ประจำ",
  officer: "เจ้าหน้าที่ธุรการประจำสาขาวิชา",
  lab_officer: "เจ้าหน้าที่ประจำห้องปฏิบัติการ",
};

function splitMultiValue(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function StaffPage() {
  // 🛠️ ดึงข้อมูลบุคลากรพร้อมสลับท่อมาดึงข้อมูลแบนเนอร์หลังบ้านผ่านรหัส "staff"
  const [staff, ps] = await Promise.all([
    getStaffMembers(),
    getPageSetting("staff").catch(() => null),
  ]);

  const sortedStaff = sortStaffMembersWithDepartmentHeadFirst(staff);

  const pageTitle = ps?.title ?? "บุคลากรสาขา";
  const pageDesc =
    ps?.description ??
    "พบกับทีมอาจารย์และเจ้าหน้าที่ผู้เชี่ยวชาญที่จะร่วมเป็นเส้นทางการเรียนรู้และพัฒนาคุณ";
  const eyebrow = ps?.subtitle ?? "ทีมงาน";

  // ตรวจจับเงื่อนไขการจัด Layout แบนเนอร์ให้เป็นไปตามระบบที่แอดมินเลือกใน Dashboard
  const heroImageUrl = ps?.hero_image_url ?? null;
  const heroImageCrop = ps?.hero_image_crop_settings ?? null;
  const rawHeroTemplate = ps?.hero_layout ?? null;

  const heroTemplate =
    rawHeroTemplate && rawHeroTemplate !== "default"
      ? rawHeroTemplate
      : heroImageUrl
        ? "background-overlay"
        : "no-image-clean";

  return (
    <>
      {/* 🚀 สวมครอบแบนเนอร์ด้วย PageHero ตัวพรีเมียม สาดแสงส้มละมุน และแกะ URL เจนแถบ Breadcrumb นำทางอัตโนมัติ */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={pageTitle}
        eyebrow={eyebrow}
        description={pageDesc}
      />

      <section className="section bg-slate-50">
        <div className="container-wide">
          {sortedStaff.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">ยังไม่มีข้อมูลในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedStaff.map((person) => (
                <article
                  key={person.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="grid gap-0 md:grid-cols-[280px_1fr] lg:grid-cols-[330px_1fr]">
                    <div className="h-[430px] w-full overflow-hidden bg-slate-100 sm:h-[500px] md:h-full md:min-h-[360px]">
                      <CroppedImage
                        src={person.image_url}
                        fallbackSrc={staffFallback}
                        alt={person.image_alt || person.full_name}
                        crop={person.image_crop_settings}
                        className="h-full w-full rounded-none bg-slate-100 transition duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-col p-5 sm:p-6 lg:p-8">
                      <div className="flex flex-wrap items-center gap-2">
                        {person.role_type && (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
                           {ROLE_LABELS[person.role_type ?? ""] || person.role_type}
                          </span>
                        )}

                        {splitMultiValue(person.position ?? "").map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <h2 className="mt-4 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
                        {person.full_name}
                      </h2>

                      {person.bio && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3 sm:line-clamp-4">
                          {person.bio}
                        </p>
                      )}

                      {(person.expertise ?? []).length > 0 && (
                        <div className="mt-5">
                          <h3 className="mb-2 text-sm font-semibold text-slate-800">
                            ความเชี่ยวชาญ
                          </h3>

                          <div className="flex flex-wrap gap-2">
                           {(person.expertise ?? []).map((item) => (
                              <span
                                key={item}
                                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-5 grid gap-2.5 text-sm text-slate-500 sm:grid-cols-2 lg:mt-6">
                        {person.education && (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-600 sm:col-span-2 whitespace-pre-line leading-relaxed">
                            {person.education}
                          </div>
                        )}

                        {person.email && (
                          <div className="flex min-w-0 items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="whitespace-pre-line break-words leading-relaxed">
                              {person.email}
                            </span>
                          </div>
                        )}

                        {person.phone && (
                          <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <span className="whitespace-pre-line break-words leading-relaxed">
                              {person.phone}
                            </span>
                          </div>
                        )}

                        {person.office && (
                          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span>{person.office}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}