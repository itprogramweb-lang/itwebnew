type Props = {
  html?: string | null;
  emptyText?: string;
};

export function sanitizeNewsHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/href\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, 'src=""');
}

export default function NewsContentRenderer({
  html,
  emptyText = "ยังไม่มีเนื้อหาในข่าวนี้",
}: Props) {
  const safeHtml = html ? sanitizeNewsHtml(html) : "";
  if (!safeHtml.trim()) {
    return <p className="py-12 text-center text-slate-500">{emptyText}</p>;
  }
  return (
    <div
      className="news-body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
