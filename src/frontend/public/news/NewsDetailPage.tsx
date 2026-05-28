import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, User, ArrowRight } from "lucide-react";
import { getNewsBySlug, getRelatedNews } from "@/lib/supabase/queries";
import CroppedImage from "@/components/ui/CroppedImage";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";
import NewsContentRenderer from "@/components/news/NewsContentRenderer";

type Props = {
  params: {
    slug: string;
  };
};

const CATEGORY_COLORS: Record<string, string> = {
  รับสมัคร: "bg-blue-100 text-blue-700 border-blue-200",
  ความสำเร็จ: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ประกาศ: "bg-amber-100 text-amber-700 border-amber-200",
  กิจกรรม: "bg-purple-100 text-purple-700 border-purple-200",
  ทุน: "bg-rose-100 text-rose-700 border-rose-200",
};

function categoryClass(cat: string | null) {
  if (!cat) return "bg-slate-100 text-slate-600 border-slate-200";

  return (
    CATEGORY_COLORS[cat] ??
    "bg-slate-100 text-slate-600 border-slate-200"
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function NewsDetailPage({ params }: Props) {
  const news = await getNewsBySlug(params.slug).catch(() => null);

  if (!news) notFound();

  const related = await getRelatedNews(news.id, news.category).catch(() => []);
  const relatedNews = related.filter((item) => Boolean(item.slug));

  const bodyHtml =
    news.content_html ||
    (news.content
      ? news.content
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
          .join("")
      : "");

  return (
    <>
      <div className="sticky top-[64px] z-[70] border-b border-slate-200 bg-white/90 backdrop-blur-xl lg:top-[88px]">
        <div className="container-wide flex justify-center py-1.5">
          <BreadcrumbTrail
            backHref="/news"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "ข่าวสาร", href: "/news" },
              { label: news.title },
            ]}
          />
        </div>
      </div>

      {/* Header: title first */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container-wide py-8 sm:py-10 lg:py-12">
<div className="mx-auto max-w-5xl">
  <div className="mb-4 flex flex-wrap items-center gap-2">
              {news.category && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${categoryClass(
                    news.category
                  )}`}
                >
                  <Tag className="h-3 w-3" />
                  {news.category}
                </span>
              )}

              {news.published_at && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(news.published_at)}
                </span>
              )}

              {news.author_name && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <User className="h-3 w-3" />
                  {news.author_name}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              {news.title}
            </h1>

            {news.excerpt && (
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {news.excerpt}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main image */}
      {news.image_url && (
        <section className="bg-white">
          <div className="container-wide pb-8 pt-6 sm:pb-10 lg:pb-12">
            <div className="mx-auto flex max-w-5xl justify-center">
              <div className="flex w-full justify-center overflow-hidden bg-transparent">
                <CroppedImage
                  src={news.image_url}
                  alt={news.image_alt ?? news.title}
                  crop={news.image_crop_settings}
                  className="max-h-[720px] w-auto max-w-full rounded-none bg-transparent object-contain"
                />
              </div>
            </div>
          </div>
        </section>
      )}

{/* Article body */}
<section className="border-b border-slate-100 bg-white pb-12 pt-2 sm:pb-16 lg:pb-20">
  <div className="container-wide">
    <article className="mx-auto max-w-5xl">
      <div className="mx-auto max-w-[900px]">
        <NewsContentRenderer html={bodyHtml} />
      </div>
    </article>
  </div>
</section>

      {/* Related news */}
      {relatedNews.length > 0 && (
        <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-14">
          <div className="container-wide">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-600">
                  Related News
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                  ข่าวที่เกี่ยวข้อง
                </h2>
              </div>

              <Link
                href="/news"
                className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-brand-600 sm:inline-flex"
              >
                ดูทั้งหมด
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group block"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-slate-950/[0.07]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-white">
                      {item.image_url ? (
                        <CroppedImage
                          src={item.image_url}
                          alt={item.image_alt ?? item.title}
                          crop={item.image_crop_settings}
                          className="h-full w-full rounded-none object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500/10 via-white to-brand-600/10">
                          <span className="text-4xl font-bold text-brand-300/50">
                            CT
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      {item.category && (
                        <span
                          className={`mb-3 inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${categoryClass(
                            item.category
                          )}`}
                        >
                          {item.category}
                        </span>
                      )}

                      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-600">
                        {item.title}
                      </h3>

                      {item.excerpt && (
                        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                          {item.excerpt}
                        </p>
                      )}

                      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                        อ่านต่อ
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to all news */}
      <section className="bg-white py-10">
        <div className="container-wide text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            <ArrowLeft className="h-4 w-4" />
            ดูข่าวสารทั้งหมด
          </Link>
        </div>
      </section>
    </>
  );
}
