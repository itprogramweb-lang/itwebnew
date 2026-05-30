"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Loader2, AlertCircle, LayoutTemplate, Save } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import type { ImageCropSettings } from "@/lib/imageCrop";
import NavigationDashboard from "@/frontend/dashboard/navigation/NavigationDashboard";

type PageSetting = {
  id?: string;
  page_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  hero_image_crop_settings: Record<string, unknown> | null;
  hero_layout: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_external: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
};

const PAGE_ITEMS = [
  { key: "home", label: "หน้าแรก" },
  { key: "apply", label: "สมัครเรียน" },
  { key: "about", label: "เกี่ยวกับสาขา" },
  { key: "contact", label: "ติดต่อเรา" },
  { key: "programs_bachelor", label: "หลักสูตรปริญญาตรี" },
  { key: "programs_master", label: "หลักสูตรปริญญาโท" },
  { key: "students_registration", label: "ทะเบียนนักศึกษา" },
  { key: "students_registrar", label: "งานทะเบียน" },
  { key: "students_feedback", label: "ความคิดเห็น / ข้อเสนอแนะ" },
  { key: "students_complaint", label: "ร้องเรียน / ความคิดเห็น" },
] as const;

const PAGE_LABEL: Record<string, string> = Object.fromEntries(
  PAGE_ITEMS.map((item) => [item.key, item.label])
);
const APPLY_LAYOUTS = [
  { value: "default", label: "ใช้ค่าจาก ตั้งค่าเว็บไซต์ (fallback)" },
  { value: "no-image-clean", label: "ไม่มีรูป — สะอาด" },
  { value: "wide-banner", label: "Banner กว้าง" },
  { value: "split-left", label: "Split ซ้าย" },
  { value: "split-right", label: "Split ขวา" },
  { value: "background-overlay", label: "Overlay บนรูป" },
  { value: "top-image", label: "รูปด้านบน" },
  { value: "side-card", label: "Side Card" },
  { value: "grid-card", label: "Grid Card" },
  { value: "compact-banner", label: "Banner กะทัดรัด" },
  { value: "poster-style", label: "Poster Style" },
];

const OTHER_LAYOUTS = [
  { value: "default", label: "แสดงรูปใต้ Header" },
  { value: "no-image", label: "ไม่แสดงรูป" },
];

function sortPages(pages: PageSetting[]) {
  return [...pages].sort((a, b) => {
    const aSort = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const bSort = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (aSort !== bSort) return aSort - bSort;
    return (PAGE_LABEL[a.page_key] ?? a.page_key).localeCompare(
      PAGE_LABEL[b.page_key] ?? b.page_key,
      "th"
    );
  });
}

function emptyForm(): PageSetting {
  return {
    page_key: "",
    title: null,
    subtitle: null,
    description: null,
    hero_image_url: null,
    hero_image_alt: null,
    hero_image_crop_settings: null,
    hero_layout: "default",
    cta_label: null,
    cta_url: null,
    cta_external: false,
    is_active: true,
    sort_order: null,
  };
}

async function getToken(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function PagesDashboard() {
  const [activeTab, setActiveTab] = useState<"pages" | "navigation">("pages");
  const [pages, setPages] = useState<PageSetting[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [form, setForm] = useState<PageSetting>(emptyForm());
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const loadPages = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/pages", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setPages(sortPages(json.pages ?? []));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "ไม่สามารถโหลดรายการหน้าเว็บได้");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

function selectPage(key: string) {
  if (!PAGE_LABEL[key]) return;

  const found = pages.find((p) => p.page_key === key);

  setSelectedKey(key);
  setSaveStatus("idle");
  setErrorMsg(null);

  if (found) {
    setForm({
      ...emptyForm(),
      ...found,
      hero_image_crop_settings: found.hero_image_crop_settings ?? null,
      hero_layout: found.hero_layout ?? "default",
      is_active: found.is_active !== false,
      cta_external: found.cta_external === true,
    });
  } else {
    setForm({ ...emptyForm(), page_key: key });
  }
}
  function setField<K extends keyof PageSetting>(key: K, value: PageSetting[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (saveStatus !== "idle") setSaveStatus("idle");
  }

  async function handleSave() {
    if (!selectedKey) return;
    setSaving(true);
    setSaveStatus("idle");
    setErrorMsg(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/admin/pages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, page_key: selectedKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");

      setSaveStatus("success");
      await loadPages();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

const pageList = PAGE_ITEMS.map((item) => {
  const found = pages.find((p) => p.page_key === item.key);

  return found ?? { ...emptyForm(), page_key: item.key };
});

const isApplyPage = selectedKey === "apply";
const layoutOptions = isApplyPage ? APPLY_LAYOUTS : OTHER_LAYOUTS;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand-gradient grid place-items-center text-white shadow-brand shrink-0">
          <LayoutTemplate className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">จัดการหน้าเว็บ</h1>
          <p className="text-sm text-slate-500">แก้ title / description / รูป hero / CTA และจัดการข้อมูลเมนูเว็บไซต์</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-950/[0.03]">
        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "pages"
              ? "bg-brand-gradient text-white shadow-brand"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          ตั้งค่าหน้าเว็บ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("navigation")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "navigation"
              ? "bg-brand-gradient text-white shadow-brand"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          จัดการเมนู
        </button>
      </div>

      {activeTab === "navigation" ? (
        <NavigationDashboard embedded />
      ) : (
        <>
          {listError && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{listError}</p>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-5">
        {/* Page list */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-950/[0.03]">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">หน้าเว็บ</p>
            </div>
            {loadingList ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            ) : (
              <ul className="py-1">
             {pageList.map((p) => (
  <li key={p.page_key}>
                    <button
                      type="button"
                      onClick={() => selectPage(p.page_key)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                        selectedKey === p.page_key
                          ? "bg-brand-50 text-brand-700 font-medium border-l-2 border-brand-500"
                          : "text-slate-700"
                      }`}
                    >
                      {PAGE_LABEL[p.page_key] ?? p.page_key}
                      <span className="ml-2 text-[10px] text-slate-400">
                        {p.sort_order !== null && p.sort_order !== undefined
                          ? `#${p.sort_order}`
                          : "ไม่กำหนดลำดับ"}
                      </span>
                      {p.is_active === false && (
                        <span className="ml-2 text-[10px] text-slate-400">(ปิดใช้งานหน้า)</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {!selectedKey ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <LayoutTemplate className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">เลือกหน้าเว็บจากรายการทางซ้ายเพื่อแก้ไข</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] overflow-hidden">
              {/* Editor Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {PAGE_LABEL[selectedKey] ?? selectedKey}
                  </p>
                  <code className="text-[11px] text-slate-400">{selectedKey}</code>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  บันทึก
                </button>
              </div>

              <div className="p-6 space-y-6">
                {saveStatus === "success" && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700">บันทึกสำเร็จแล้ว</p>
                  </div>
                )}
                {saveStatus === "error" && errorMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <p className="text-sm text-rose-700">{errorMsg}</p>
                  </div>
                )}

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">ข้อความหลัก</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Title (หัวข้อหน้า)
                      </label>
                      <input
                        type="text"
                        value={form.title ?? ""}
                        onChange={(e) => setField("title", e.target.value || null)}
                        placeholder="ปล่อยว่าง = ใช้ค่า default ของหน้า"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Subtitle / Eyebrow (ข้อความเล็กด้านบน)
                      </label>
                      <input
                        type="text"
                        value={form.subtitle ?? ""}
                        onChange={(e) => setField("subtitle", e.target.value || null)}
                        placeholder="ปล่อยว่าง = ใช้ค่า default"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Description (คำอธิบาย)
                      </label>
                      <textarea
                        rows={3}
                        value={form.description ?? ""}
                        onChange={(e) => setField("description", e.target.value || null)}
                        placeholder="ปล่อยว่าง = ใช้ค่า default"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">รูปหลัก (Hero Image)</h3>
                  <div className="space-y-4">
                    <CloudinaryImageUploader
                      value={form.hero_image_url ?? undefined}
                      onChange={(url) => setField("hero_image_url", url || null)}
                      folder="page-heroes"
                      label="อัปโหลดรูปหลักของหน้า"
                    />
                    {form.hero_image_url && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Alt text (คำอธิบายรูป)
                          </label>
                          <input
                            type="text"
                            value={form.hero_image_alt ?? ""}
                            onChange={(e) => setField("hero_image_alt", e.target.value || null)}
                            placeholder="คำอธิบายรูปสำหรับ accessibility"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                          />
                        </div>
                        <ImageCropControls
                          imageUrl={form.hero_image_url}
                          alt="hero preview"
                          value={form.hero_image_crop_settings as ImageCropSettings | null}
                          onChange={(crop) =>
                            setField("hero_image_crop_settings", crop as Record<string, unknown>)
                          }
                          aspectPreset="16:9"
                          frameShape="rounded"
                          previewClassName="aspect-video w-full"
                        />
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Hero Layout{isApplyPage ? " (template หน้าสมัครเรียน)" : ""}
                      </label>
                      <select
                        value={form.hero_layout ?? "default"}
                        onChange={(e) => setField("hero_layout", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      >
                        {layoutOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">ปุ่ม CTA (Call to Action)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        ชื่อปุ่ม CTA
                      </label>
                      <input
                        type="text"
                        value={form.cta_label ?? ""}
                        onChange={(e) => setField("cta_label", e.target.value || null)}
                        placeholder="เช่น ดูรายละเอียด, สมัครเลย"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        URL ของปุ่ม CTA
                      </label>
                      <input
                        type="text"
                        value={form.cta_url ?? ""}
                        onChange={(e) => setField("cta_url", e.target.value || null)}
                        placeholder="/apply หรือ https://..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.cta_external === true}
                        onChange={(e) => setField("cta_external", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 accent-brand-500"
                      />
                      <span className="text-sm text-slate-700">เปิดในแท็บใหม่ (external link)</span>
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3">การแสดงผลในเมนู</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.is_active !== false}
                        onChange={(e) => setField("is_active", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 accent-brand-500"
                      />
                      <span className="text-sm text-slate-700">เปิดใช้งานหน้า / page settings</span>
                    </label>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        ลำดับในตัวจัดการ
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.sort_order ?? ""}
                        onChange={(e) =>
                          setField(
                            "sort_order",
                            e.target.value === "" ? null : Number(e.target.value)
                          )
                        }
                        placeholder="ไม่กำหนด"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    เมนูหลักของเว็บไซต์ยังใช้โครงสร้างคงที่ในรอบนี้ ค่าเหล่านี้ใช้จัดการ page settings และลำดับในตัวจัดการเท่านั้น
                  </p>
                </section>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-brand-gradient text-white text-sm font-medium shadow-brand disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    บันทึกการเปลี่ยนแปลง
                  </button>
                  <p className="mt-2 text-xs text-slate-400">
                    ปล่อยช่องว่าง = ใช้ข้อความ default ของหน้า, refresh แล้วข้อมูลยังอยู่
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
        </>
      )}
    </div>
  );
}
