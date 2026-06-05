"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Send } from "lucide-react";
import Link from "next/link";

import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import Button from "@/components/ui/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/Form";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type QuickNewsFormState = {
  title: string;
  category: string;
  image_url: string;
  image_alt: string;
  content_html: string;
  status: "draft" | "published";
};

const EMPTY_FORM: QuickNewsFormState = {
  title: "",
  category: "ประกาศ",
  image_url: "",
  image_alt: "",
  content_html: "",
  status: "published",
};

function toSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "news"
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainTextToHtml(text: string) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

async function getAuthHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อนเพิ่มข่าว");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function QuickNewsForm() {
  const [form, setForm] = useState<QuickNewsFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof QuickNewsFormState>(
    key: K,
    value: QuickNewsFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const detail = form.content_html.trim();

    if (!title) {
      setError("กรุณากรอกหัวข้อข่าว");
      return;
    }

    if (!detail) {
      setError("กรุณากรอกรายละเอียดข่าว");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();

      const payload = {
        title,
        slug: toSlug(title),
        excerpt: detail.length > 160 ? `${detail.slice(0, 160)}...` : detail,
        content_html: plainTextToHtml(detail),
        category: form.category || null,
        image_url: form.image_url || null,
        image_alt: form.image_alt || title,

        // ให้ API บังคับเป็น Admin อีกชั้นอยู่แล้ว
        author_name: "Admin",

        // ถ้า published และไม่ส่ง published_at API จะใช้เวลาปัจจุบัน
        status: form.status,
        published_at: null,

        is_featured: false,
        sort_order: 0,
      };

      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.newsItem) {
        throw new Error(data.error || "ไม่สามารถเพิ่มข่าวได้");
      }

      setNotice(
        form.status === "published"
          ? "เพิ่มและเผยแพร่ข่าวเรียบร้อยแล้ว"
          : "บันทึกข่าวเป็นฉบับร่างเรียบร้อยแล้ว",
      );

      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเพิ่มข่าวได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/dashboard/news"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </Link>

          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Quick News
          </span>
        </div>

        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-5 py-5">
            <h1 className="text-xl font-bold text-slate-950">
              เพิ่มข่าวแบบลัด
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              สำหรับเพิ่มข่าวจากมือถืออย่างรวดเร็ว กรอกเฉพาะข้อมูลจำเป็น
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            {notice && (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <FormInput
              label="หัวข้อข่าว"
              required
              value={form.title}
              placeholder="เช่น ประกาศรับสมัครนักศึกษาใหม่"
              onChange={(e) => set("title", e.target.value)}
            />

            <FormSelect
              label="หมวดหมู่ข่าว"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              options={[
                { value: "ประกาศ", label: "ประกาศ" },
                { value: "รับสมัคร", label: "รับสมัคร" },
                { value: "กิจกรรม", label: "กิจกรรม" },
                { value: "ทุน", label: "ทุน" },
                { value: "ความสำเร็จ", label: "ความสำเร็จ" },
              ]}
            />

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <ImagePlus className="h-4 w-4 text-slate-400" />
                รูปภาพ
              </label>

              <CloudinaryImageUploader
                value={form.image_url}
                onChange={(url) => set("image_url", url)}
                folder="news"
                label="อัปโหลดรูปข่าว"
              />

              {form.image_url && (
                <input
                  type="text"
                  value={form.image_alt}
                  onChange={(e) => set("image_alt", e.target.value)}
                  placeholder="คำอธิบายรูปภาพ"
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
                />
              )}
            </div>

            <FormTextarea
              label="รายละเอียดข่าว"
              required
              rows={8}
              value={form.content_html}
              placeholder="พิมพ์รายละเอียดข่าวที่นี่..."
              onChange={(e) => set("content_html", e.target.value)}
            />

            <FormSelect
              label="สถานะ"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as "draft" | "published")
              }
              options={[
                { value: "published", label: "เผยแพร่ทันที" },
                { value: "draft", label: "บันทึกเป็นฉบับร่าง" },
              ]}
            />
          </div>

          <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full justify-center py-3 text-base"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {saving ? "กำลังบันทึก..." : "บันทึกข่าว"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}