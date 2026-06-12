import type { Metadata } from "next";
import { getNewsBySlug } from "@/lib/supabase/queries";
import NewsDetailPage from "@/frontend/public/news/NewsDetailPage";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug).catch(() => null);

  if (!news) return { title: "ไม่พบข่าว" };

  return {
    title: news.title,
    description: news.excerpt ?? undefined,
    openGraph: {
      title: news.title,
      description: news.excerpt ?? undefined,
      images: news.image_url ? [{ url: news.image_url }] : [],
      type: "article",
    },
  };
}

export default function Page(props: Props) {
  return <NewsDetailPage {...props} />;
}