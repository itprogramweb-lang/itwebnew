import Link from "next/link";
import { Calendar, Tag, ArrowRight, Newspaper, Megaphone } from "lucide-react";
import { getNews, getPageSetting } from "@/lib/supabase/queries";
import CroppedImage from "@/components/ui/CroppedImage";
// 🛠️ ดึง PageHero ชิ้นงานกลางเข้ามาคุมระบบแบนเนอร์ แสงสีส้ม และ Breadcrumb แทน PageHeader ตัวเก่า
import PageHero from "@/components/ui/PageHero";

const CATEGORY_COLORS: Record<string, string> = {
  รับสมัคร: "bg-blue-50 text-blue-700 border-blue-200",
  ความสำเร็จ: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ประกาศ: "bg-amber-50 text-amber-700 border-amber-200",
  กิจกรรม: "bg-purple-50 text-purple-700 border-purple-200",
  ทุน: "bg-rose-50 text-rose-700 border-rose-200",
};

function categoryClass(cat: string | null) {
  if (!cat) return "bg-slate-50 text-slate-600 border-slate-200";

  return (
    CATEGORY_COLORS[cat] ??
    "bg-slate-50 text-slate-600 border-slate-200"
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";

  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function NewsFallback({ large = false }: { large?: boolean }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="flex flex-col items-center gap-2 text-slate-300">
        <Newspaper className={large ? "h-14 w-14" : "h-10 w-10"} />
        {large && (
          <span className="text-xs font-medium text-slate-400">
            Computer Technology News
          </span>
        )}
      </div>
    </div>
  );
}

function getNewsTime(item: {
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}) {
  const source = item.published_at || item.created_at || item.updated_at || "";
  const time = new Date(source).getTime();

  return Number.isFinite(time) ? time : 0;
}

export default async function NewsListPage() {
  // ดึงข้อมูลข่าวสารพร้อมข้อมูลตั้งค่าหน้าบานเนอร์หลังบ้านร่วมกันแบบ Parallel
  const [newsList, ps] = await Promise.all([
    getNews().catch(() => []),
    getPageSetting("news").catch(() => null),
  ]);

  const fallbackTitle = ps?.title ?? "ข่าวจากสาขา";
  const fallbackDesc =
    ps?.description ??
    "ติดตามข่าวประกาศ กิจกรรม ทุนการศึกษา และความสำเร็จของสาขาวิชา";
  const eyebrow = ps?.subtitle ?? "ข่าวสารและประกาศ";

  const featuredList = [...newsList]
    .filter((n) => n.is_featured)
    .sort((a, b) => {
      const orderA = a.sort_order ?? 999;
      const orderB = b.sort_order ?? 999;

      if (orderA !== orderB) return orderA - orderB;
      return getNewsTime(b) - getNewsTime(a);
    })
    .slice(0, 5);

  const featuredIds = new Set(featuredList.map((n) => n.id));

  const rest = [...newsList]
    .filter((n) => !featuredIds.has(n.id))
    .sort((a, b) => getNewsTime(b) - getNewsTime(a));

  // ตรวจจับเงื่อนไขจัดหน้า Layout แบนเนอร์ให้เป็นไปตามระบบหลังบ้านคุม
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
      {/* 🚀 สวมครอบแบนเนอร์ด้วย PageHero ตัวพรีเมียม สาดแสงส้มละมุน และขึงแถบ Breadcrumb นำทางอัตโนมัติ */}
      <PageHero
        template={heroTemplate}
        imageUrl={heroImageUrl}
        imageCropSettings={heroImageCrop}
        title={fallbackTitle}
        eyebrow={eyebrow}
        description={fallbackDesc}
      />

      <section className="bg-gradient-to-b from-white via-white to-slate-50 py-12 sm:py-14 lg:py-16">
        <div className="container-wide">
          {newsList.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                <Newspaper className="h-9 w-9 text-slate-300" />
              </div>

              <h2 className="text-xl font-semibold text-slate-700">
                ยังไม่มีข่าวสาร in ขณะนี้
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                โปรดติดตามข่าวสาร ประกาศ และกิจกรรมจากสาขาวิชาได้เร็ว ๆ นี้
              </p>
            </div>
          ) : (
            <div className="space-y-14">
              {/* Featured news */}
              {featuredList.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <Megaphone className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                        Featured News
                      </p>
                      <h2 className="text-2xl font-bold text-slate-950">
                        ข่าวเด่น
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {featuredList.map((featured) => (
                      <Link
                        key={featured.id}
                        href={featured.slug ? `/news/${featured.slug}` : "/news"}
                        className="group block h-full"
                      >
                        <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-950/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-950/[0.08]">
                          <div className="relative aspect-[16/9] max-h-[280px] overflow-hidden bg-slate-50">
                            {featured.image_url ? (
                              <CroppedImage
                                src={featured.image_url}
                                alt={featured.image_alt ?? featured.title}
                                crop={featured.image_crop_settings}
                                className="h-full w-full rounded-none object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <NewsFallback large />
                            )}

                            <div className="absolute left-5 top-5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
                              ข่าวเด่น
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-6 sm:p-7">
                            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {featured.category && (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${categoryClass(
                                    featured.category
                                  )}`}
                                >
                                  <Tag className="h-3 w-3" />
                                  {featured.category}
                                </span>
                              )}

                              {featured.published_at && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(featured.published_at)}
                                </span>
                              )}
                            </div>

                            <h3 className="line-clamp-2 text-xl font-bold leading-snug text-slate-950 transition-colors group-hover:text-brand-700 sm:text-2xl">
                              {featured.title}
                            </h3>

                            {featured.excerpt && (
                              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                                {featured.excerpt}
                              </p>
                            )}

                            <div className="mt-auto pt-5">
                              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors group-hover:bg-brand-100">
                                อ่านรายละเอียด
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* News grid */}
              {rest.length > 0 && (
                <div>
                  <div className="mb-7 flex items-end justify-between gap-4 border-t border-slate-200 pt-10">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                        All News
                      </p>
                      <h2 className="mt-1 text-2xl font-bold text-slate-950">
                        ข่าวสารทั้งหมด
                      </h2>
                    </div>

                    <p className="hidden text-sm text-slate-400 sm:block">
                      ทั้งหมด {rest.length} รายการ
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((item) => {
                      const href = item.slug ? `/news/${item.slug}` : "/news";

                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className="group block h-full"
                        >
                          <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-950/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-slate-950/[0.07]">
                            <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
                              {item.image_url ? (
                                <CroppedImage
                                  src={item.image_url}
                                  alt={item.image_alt ?? item.title}
                                  crop={item.image_crop_settings}
                                  className="h-full w-full rounded-none object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <NewsFallback />
                              )}

                              {item.category && (
                                <div className="absolute left-4 top-4">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border bg-white/95 px-2.5 py-1 text-xs font-medium backdrop-blur ${categoryClass(
                                      item.category
                                    )}`}
                                  >
                                    <Tag className="h-3 w-3" />
                                    {item.category}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                {item.published_at && (
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(item.published_at)}
                                  </span>
                                )}
                              </div>

                              <h3 className="line-clamp-2 text-lg font-bold leading-snug text-slate-950 transition-colors group-hover:text-brand-700">
                                {item.title}
                              </h3>

                              {item.excerpt && (
                                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                                  {item.excerpt}
                                </p>
                              )}

                              <div className="mt-auto pt-5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                                  อ่านต่อ
                                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </span>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}