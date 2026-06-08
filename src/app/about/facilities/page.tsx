import {
  Cpu,
  FlaskConical,
  ImageIcon,
  Monitor,
  Network,
  Sparkles,
} from "lucide-react";
import { getLearningFacilities, getPageSetting } from "@/lib/supabase/queries";
// 🛠️ เปลี่ยนมาดึง PageHero ชิ้นงานกลางเข้ามาคุมระบบแบนเนอร์ แสงสีส้ม และ Breadcrumb แทน PageHeader ตัวเก่า
import PageHero from "@/components/ui/PageHero";

export const dynamic = "force-dynamic";

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: typeof Monitor;
    description: string;
  }
> = {
  lab: {
    label: "ห้องปฏิบัติการ",
    icon: Monitor,
    description: "พื้นที่สำหรับการเรียนรู้และฝึกปฏิบัติจริง",
  },
  equipment: {
    label: "อุปกรณ์การเรียน",
    icon: Cpu,
    description: "อุปกรณ์สนับสนุนการเรียนและการทำโปรเจกต์",
  },
  network: {
    label: "ห้องปฏิบัติการเครือข่าย",
    icon: Network,
    description: "พื้นที่สำหรับเรียนรู้ระบบเครือข่ายและโครงสร้างพื้นฐาน",
  },
  project_space: {
    label: "พื้นที่ทำโปรเจกต์",
    icon: FlaskConical,
    description: "พื้นที่สำหรับทดลอง พัฒนา และสร้างผลงานจริง",
  },
  gallery: {
    label: "บรรยากาศการเรียน",
    icon: ImageIcon,
    description: "ภาพบรรยากาศการเรียนและการฝึกปฏิบัติจริง",
  },
};

const TYPE_ORDER = ["lab", "network", "equipment", "project_space", "gallery"];

function typeLabel(type: string) {
  return TYPE_META[type]?.label ?? type;
}

function typeDescription(type: string) {
  return TYPE_META[type]?.description ?? "พื้นที่สนับสนุนการเรียนรู้ของสาขา";
}

function typeIcon(type: string) {
  return TYPE_META[type]?.icon ?? FlaskConical;
}

export default async function FacilitiesPage() {
  // 🛠️ ดึงข้อมูลห้องปฏิบัติการพร้อมดึงข้อมูลการตั้งค่าแบนเนอร์หลังบ้านผ่านคีย์ "laboratories"
  const [facilities, ps] = await Promise.all([
    getLearningFacilities(),
    getPageSetting("laboratories").catch(() => null),
  ]);

  const fallbackTitle = ps?.title ?? "อุปกรณ์การเรียนและห้องปฏิบัติการ";
  const fallbackDesc =
    ps?.description ??
    "พื้นที่ อุปกรณ์ และห้องปฏิบัติการที่สนับสนุนการเรียนรู้แบบลงมือทำจริง เพื่อให้นักศึกษาได้ฝึกทักษะด้านเทคโนโลยีผ่านสภาพแวดล้อมที่ใกล้เคียงกับการทำงานจริง";
  const eyebrow = ps?.subtitle ?? "สิ่งสนับสนุนการเรียนรู้";

  const featured = facilities.filter((item) => item.is_featured);

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: typeLabel(type),
    description: typeDescription(type),
    items: facilities.filter((item) => item.type === type),
  })).filter((group) => group.items.length > 0);

  const galleryImages = facilities.flatMap((item) => {
    if (!Array.isArray(item.gallery_images)) return [];

    return item.gallery_images
      .filter((img) => img.url)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((img) => ({
        ...img,
        parentTitle: item.title,
        parentType: item.type,
      }));
  });

  const totalRooms = facilities.filter((item) =>
    ["lab", "network", "project_space"].includes(item.type),
  ).length;

  const totalEquipment = facilities.filter(
    (item) => item.type === "equipment",
  ).length;

  // ตรวจจับเทมเพลต Layout แบนเนอร์ให้แสดงตามหลังบ้านคุม
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
      {/* 🚀 เรียกใช้ PageHero ส่วนกลางเพื่อสร้างแบนเนอร์สาดแสงส้ม และเจนระบบ Breadcrumb ให้อัตโนมัติ */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={fallbackTitle}
        eyebrow={eyebrow}
        description={fallbackDesc}
      />

      <main className="bg-slate-50">
        <section className="section">
          <div className="container-wide">
            <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-700 ring-1 ring-orange-100">
                    <FlaskConical className="h-4 w-4" />
                    Learning Facilities
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    พื้นที่สำหรับการเรียนรู้และฝึกปฏิบัติจริง
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    ข้อมูลในหน้านี้ดึงจากระบบจัดการหลังบ้าน
                    สามารถเพิ่ม แก้ไข ซ่อน หรือจัดลำดับข้อมูลได้จากหน้า Dashboard
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <StatCard label="รายการทั้งหมด" value={facilities.length} />
                  <StatCard label="ห้อง/พื้นที่" value={totalRooms} />
                  <StatCard label="อุปกรณ์" value={totalEquipment} />
                </div>
              </div>
            </div>

            {facilities.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {featured.length > 0 && (
                  <section className="mb-12">
                    <SectionHeading
                      eyebrow="Featured"
                      title="รายการเด่น"
                      description="ห้องและอุปกรณ์ที่ถูกเลือกให้แสดงเป็นรายการสำคัญ"
                    />

                    <div className="grid gap-6 lg:grid-cols-3">
                      {featured.slice(0, 3).map((item) => (
                        <FeatureCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                )}

                <div className="space-y-14">
                  {grouped.map((group) => (
                    <section key={group.type}>
                      <SectionHeading
                        eyebrow={group.label}
                        title={group.label}
                        description={group.description}
                      />

                      <div className="space-y-6">
                        {group.items.map((item, index) => (
                          <FacilityDetailCard
                            key={item.id}
                            item={item}
                            reverse={index % 2 === 1}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                {galleryImages.length > 0 && (
                  <section className="mt-16">
                    <SectionHeading
                      eyebrow="Gallery"
                      title="ภาพบรรยากาศห้องเรียนและการฝึกปฏิบัติ"
                      description="รวมภาพจากห้องปฏิบัติการ อุปกรณ์ และพื้นที่การเรียนรู้ของสาขา"
                    />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {galleryImages.map((img, index) => (
                        <figure
                          key={`${img.url}-${index}`}
                          className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                        >
                          <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                            <img
                              src={img.url}
                              alt={
                                img.alt ||
                                img.parentTitle ||
                                "ภาพบรรยากาศการเรียน"
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          </div>

                          {(img.caption || img.parentTitle) && (
                            <figcaption className="p-4">
                              <p className="text-sm font-semibold text-slate-900">
                                {img.caption || img.parentTitle}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {typeLabel(img.parentType)}
                              </p>
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-orange-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  item,
}: {
  item: Awaited<ReturnType<typeof getLearningFacilities>>[number];
}) {
  const Icon = typeIcon(item.type);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {item.cover_image_url ? (
          <img
            src={item.cover_image_url}
            alt={item.cover_image_alt || item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            ไม่มีรูปภาพ
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
          <Icon className="h-6 w-6" />
        </div>

        <p className="mb-2 text-sm font-semibold text-orange-600">
          {typeLabel(item.type)}
        </p>

        <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>

        {item.short_description && (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
            {item.short_description}
          </p>
        )}

        <MetaBadges item={item} />
      </div>
    </article>
  );
}

function FacilityDetailCard({
  item,
  reverse,
}: {
  item: Awaited<ReturnType<typeof getLearningFacilities>>[number];
  reverse?: boolean;
}) {
  const Icon = typeIcon(item.type);
  const highlights = item.highlights ?? [];
  const equipment = item.equipment_list ?? [];

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className={
          reverse
            ? "grid gap-0 lg:grid-cols-[1fr_430px]"
            : "grid gap-0 lg:grid-cols-[430px_1fr]"
        }
      >
        <div
          className={
            reverse
              ? "relative h-[260px] overflow-hidden bg-slate-100 lg:order-2 lg:h-full lg:min-h-[380px]"
              : "relative h-[260px] overflow-hidden bg-slate-100 lg:h-full lg:min-h-[380px]"
          }
        >
          {item.cover_image_url ? (
            <img
              src={item.cover_image_url}
              alt={item.cover_image_alt || item.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              ไม่มีรูปภาพ
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
            <Icon className="h-6 w-6" />
          </div>

          <p className="mb-2 text-sm font-semibold text-orange-600">
            {typeLabel(item.type)}
          </p>

          <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>

          {item.short_description && (
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              {item.short_description}
            </p>
          )}

          {item.description && (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {item.description}
            </p>
          )}

          <MetaBadges item={item} />

          {highlights.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">
                จุดเด่น
              </h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {highlights.map((text) => (
                  <td
                    key={text}
                    className="flex gap-2 text-sm leading-6 text-slate-600"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{text}</span>
                  </td>
                ))}
              </ul>
            </div>
          )}

          {equipment.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">
                รายการอุปกรณ์
              </h4>
              <div className="flex flex-wrap gap-2">
                {equipment.map((text) => (
                  <span
                    key={text}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function MetaBadges({
  item,
}: {
  item: Awaited<ReturnType<typeof getLearningFacilities>>[number];
}) {
  if (!item.location && !item.capacity) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {item.location && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          สถานที่: {item.location}
        </span>
      )}

      {item.capacity && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          รองรับ: {item.capacity}
        </span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FlaskConical className="h-7 w-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        ยังไม่มีข้อมูลอุปกรณ์และห้องปฏิบัติการ
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
        เมื่อเพิ่มข้อมูลจาก Dashboard แล้ว รายการที่เปิดแสดงจะปรากฏในหน้านี้โดยอัตโนมัติ
      </p>
    </div>
  );
}