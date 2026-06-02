"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Pencil, Trash2, CheckCircle2, AlertCircle, Star, Upload } from "lucide-react";
import { teacherWorksApi } from "@/frontend/api/teacherWorks";
import { getAuthToken } from "@/frontend/api/http";
import { TeacherWorkRow } from "@/lib/supabase/queries";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import {
  DashboardPageHeader,
  SearchFilter,
  FilterSelect,
  AddButton,
  TableShell,
  Th,
  Td,
  EmptyRow,
} from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormInput, FormTextarea, FormSelect, Label } from "@/components/ui/Form";
import CroppedImage from "@/components/ui/CroppedImage";
import { cropToJson, getDefaultImageCrop, type ImageCropSettings } from "@/lib/imageCrop";

// ─── types ──────────────────────────────────────────────────────────────────

type FormData = {
  title: string;
  description: string;
  category: string;
  year: string;
  teacher_name: string;
  image_url: string;
  image_alt: string;
  image_crop_settings: ImageCropSettings;
  pdf_url: string;
  pdf_filename: string;
  project_url: string;
  external_url: string;
  source_type: string;
  source_system: string;
  is_featured: boolean;
  is_active: boolean;
};

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  category: "research",
  year: "",
  teacher_name: "",
  image_url: "",
  image_alt: "",
  image_crop_settings: getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" }),
  pdf_url: "",
  pdf_filename: "",
  project_url: "",
  external_url: "",
  source_type: "internal",
  source_system: "",
  is_featured: false,
  is_active: true,
};

const CATEGORY_LABELS: Record<string, string> = {
  research: "งานวิจัย",
  article: "บทความวิชาการ",
  award: "รางวัล",
  service: "บริการวิชาการ",
  other: "อื่น ๆ",
};

const DEFAULT_CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

const categoryLabel = (value: string) => CATEGORY_LABELS[value] ?? value;

// ─── helpers ─────────────────────────────────────────────────────────────────

const toForm = (w: TeacherWorkRow): FormData => ({
  title: w.title,
  description: w.description ?? "",
  category: w.category ?? "research",
  year: w.year ?? "",
  teacher_name: w.teacher_name ?? "",
  image_url: w.image_url ?? "",
  image_alt: w.image_alt ?? "",
  image_crop_settings: cropToJson(w.image_crop_settings),
  pdf_url: w.pdf_url ?? "",
  pdf_filename: w.pdf_filename ?? "",
  project_url: w.project_url ?? "",
  external_url: w.external_url ?? "",
  source_type: w.source_type ?? "internal",
  source_system: w.source_system ?? "",
  is_featured: w.is_featured ?? false,
  is_active: w.is_active ?? true,
});

const toPayload = (f: FormData) => ({
  title: f.title.trim(),
  description: f.description.trim() || null,
  category: f.category || null,
  year: f.year.trim() || null,
  teacher_name: f.teacher_name.trim() || null,
  image_url: f.image_url.trim() || null,
  image_alt: f.image_alt.trim() || f.title.trim() || null,
  image_crop_settings: cropToJson(f.image_crop_settings),
  pdf_url: f.pdf_url.trim() || null,
  pdf_filename: f.pdf_filename.trim() || null,
  project_url: f.project_url.trim() || null,
  external_url: f.external_url.trim() || null,
  source_type: f.source_type || "internal",
  source_system: f.source_system.trim() || null,
  is_featured: f.is_featured,
  is_active: f.is_active,
});

const validate = (f: FormData): string[] => {
  const errs: string[] = [];
  if (!f.title.trim()) errs.push("กรุณากรอกชื่อผลงาน");
  if (f.pdf_url.trim() && !f.pdf_url.trim().toLowerCase().endsWith(".pdf")) {
    errs.push("URL หรือ path ไฟล์ PDF ต้องลงท้ายด้วย .pdf");
  }
  return errs;
};

// ─── component ───────────────────────────────────────────────────────────────

export default function TeacherWorksDashboard() {
  const [items, setItems] = useState<TeacherWorkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadMessage, setPdfUploadMessage] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await teacherWorksApi.list();
      setItems(data);
    } catch {
      showToast("โหลดข้อมูลไม่สำเร็จ", false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const dataCategoryOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const item of items) {
      const value = item.category?.trim();
      if (value) seen.add(value);
    }
    return [...seen]
      .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "th"))
      .map((value) => ({ value, label: categoryLabel(value) }));
  }, [items]);

  const categoryFilterOptions = useMemo(
    () => [{ value: "all", label: "ทุกประเภท" }, ...dataCategoryOptions],
    [dataCategoryOptions]
  );

  const formCategoryOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const option of DEFAULT_CATEGORY_OPTIONS) options.set(option.value, option.label);
    for (const option of dataCategoryOptions) options.set(option.value, option.label);
    return [...options].map(([value, label]) => ({ value, label }));
  }, [dataCategoryOptions]);

  useEffect(() => {
    if (catFilter === "all") return;
    if (!dataCategoryOptions.some((option) => option.value === catFilter)) {
      setCatFilter("all");
    }
  }, [catFilter, dataCategoryOptions]);

  const filtered = useMemo(() => {
    return items.filter((w) => {
      const needle = q.trim().toLowerCase();
      const category = w.category?.trim() ?? "";
      const haystack = [
        w.title,
        w.description,
        w.category,
        w.teacher_name,
        w.year,
        w.project_url,
        w.external_url,
        w.pdf_url,
        w.pdf_filename,
        w.source_type,
        w.source_system,
        w.image_alt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQ = !needle || haystack.includes(needle);
      const matchCat = catFilter === "all" || category === catFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? w.is_active !== false : w.is_active === false);
      return matchQ && matchCat && matchStatus;
    });
  }, [items, q, catFilter, statusFilter]);

  // ── form helpers ──────────────────────────────────────────────────────────
  const FI = (k: keyof FormData) => ({
    value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value })),
  });
  const FT = (k: keyof FormData) => ({
    value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value })),
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors([]);
    setPdfFile(null);
    setPdfUploadMessage(null);
    setModalOpen(true);
  };

  const openEdit = (w: TeacherWorkRow) => {
    setEditingId(w.id);
    setForm(toForm(w));
    setErrors([]);
    setPdfFile(null);
    setPdfUploadMessage(null);
    setModalOpen(true);
  };

  const handlePdfUpload = async () => {
    const uploadErrors: string[] = [];
    if (!editingId) uploadErrors.push("กรุณาบันทึกผลงานก่อนอัปโหลด PDF");
    if (!pdfFile) uploadErrors.push("ไม่พบไฟล์ PDF");
    if (pdfFile && pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
      uploadErrors.push("รองรับเฉพาะไฟล์ PDF เท่านั้น");
    }
    if (pdfFile && pdfFile.size > 25 * 1024 * 1024) {
      uploadErrors.push("ไฟล์ PDF มีขนาดใหญ่เกินกำหนด");
    }

    if (uploadErrors.length) {
      setPdfUploadMessage({ msg: uploadErrors.join(" / "), ok: false });
      return;
    }

    const workId = editingId;
    if (!workId) return;

    setPdfUploading(true);
    setPdfUploadMessage(null);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");

      const data = new FormData();
      data.append("file", pdfFile!);
      data.append("work_id", workId);
      data.append("year", form.year.trim());

      const res = await fetch("/api/admin/teacher-works/upload-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "same-origin",
        body: data,
      });
      const json = (await res.json()) as { ok?: boolean; pdf_url?: string; pdf_filename?: string; error?: string };
      if (!res.ok || !json.ok || !json.pdf_url || !json.pdf_filename) {
        throw new Error(json.error || "อัปโหลดไฟล์ PDF ไม่สำเร็จ");
      }
      setForm((p) => ({
        ...p,
        pdf_url: json.pdf_url!,
        pdf_filename: json.pdf_filename!,
      }));
      setPdfUploadMessage({ msg: "อัปโหลด PDF เรียบร้อยแล้ว กรุณากดบันทึกผลงาน", ok: true });
      showToast("อัปโหลด PDF เรียบร้อยแล้ว");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "อัปโหลดไฟล์ PDF ไม่สำเร็จ";
      setPdfUploadMessage({ msg, ok: false });
      showToast(msg, false);
    } finally {
      setPdfUploading(false);
    }
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSaving(true);
    const payload = toPayload(form);
    try {
      if (editingId) {
        const updated = await teacherWorksApi.update(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        showToast("บันทึกเรียบร้อยแล้ว");
      } else {
        const created = await teacherWorksApi.create(payload);
        setItems((prev) => [...prev, created]);
        showToast("เพิ่มผลงานเรียบร้อยแล้ว");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(
        (editingId ? "บันทึกไม่สำเร็จ: " : "เพิ่มผลงานไม่สำเร็จ: ") +
          (err instanceof Error ? err.message : String(err)),
        false
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await teacherWorksApi.remove(confirmId);
      setItems((prev) => prev.filter((x) => x.id !== confirmId));
      showToast("ลบผลงานเรียบร้อยแล้ว");
    } catch {
      showToast("ลบผลงานไม่สำเร็จ", false);
    }
    setConfirmId(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardPageHeader
        title="ผลงานอาจารย์"
        description={`ทั้งหมด ${items.length} รายการ`}
        action={<AddButton label="เพิ่มผลงาน" onClick={openAdd} />}
      />

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาชื่อผลงาน อาจารย์ ปี หมวดหมู่ PDF...">
        <FilterSelect
          value={catFilter}
          onChange={setCatFilter}
          options={categoryFilterOptions}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "active", label: "แสดงอยู่" },
            { value: "all", label: "ทั้งหมด" },
            { value: "inactive", label: "ซ่อนอยู่" },
          ]}
        />
      </SearchFilter>

      <TableShell>
        <thead className="bg-slate-50/60">
          <tr>
            <Th>ชื่อผลงาน</Th>
            <Th>อาจารย์</Th>
            <Th>ประเภท</Th>
            <Th>ปี</Th>
            <Th>ลิงก์</Th>
            <Th>สถานะ</Th>
            <Th className="text-right">จัดการ</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow colSpan={7} label="กำลังโหลด..." />
          ) : filtered.length === 0 ? (
            <EmptyRow colSpan={7} />
          ) : (
            filtered.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <CroppedImage
                        src={w.image_url ?? ""}
                        alt={w.image_alt ?? w.title}
                        fallbackSrc="/placeholders/teacher-work-placeholder.svg"
                        crop={w.image_crop_settings}
                        className="h-full w-full rounded-none"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 line-clamp-1 max-w-xs flex items-center gap-1">
                        {w.title}
                        {w.is_featured && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      {w.description && (
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                          {w.description}
                        </div>
                      )}
                    </div>
                  </div>
                </Td>
                <Td className="text-slate-700 text-xs whitespace-nowrap">
                  {w.teacher_name ?? "-"}
                </Td>
                <Td>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 border border-brand-100">
                    {CATEGORY_LABELS[w.category ?? ""] ?? w.category ?? "-"}
                  </span>
                </Td>
                <Td className="text-slate-500 text-xs">{w.year ?? "-"}</Td>
                <Td>
                  {w.pdf_url ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-sky-50 text-sky-700 border border-sky-100">
                      มี PDF
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </Td>
                <Td>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      w.is_active !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {w.is_active !== false ? "แสดง" : "ซ่อน"}
                  </span>
                </Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => openEdit(w)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                      title="แก้ไข"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmId(w.id)}
                      title="ลบถาวร"
                      className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl my-6 shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "แก้ไขผลงาน" : "เพิ่มผลงานใหม่"}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-rose-700 space-y-1">
                  {errors.map((e, i) => <div key={i}>• {e}</div>)}
                </div>
              )}

              {/* Image preview */}
              {form.image_url && (
                <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100">
                  <CroppedImage
                    src={form.image_url}
                    alt={form.image_alt || form.title}
                    fallbackSrc="/placeholders/teacher-work-placeholder.svg"
                    crop={form.image_crop_settings}
                    className="h-full w-full rounded-none"
                  />
                </div>
              )}

              <CloudinaryImageUploader
                value={form.image_url}
                onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
                folder="teacher-works"
                label="อัปโหลดรูปผลงาน"
              />
              {form.image_url && (
                <ImageCropControls
                  imageUrl={form.image_url}
                  alt={form.image_alt || form.title || "teacher work"}
                  value={form.image_crop_settings}
                  onChange={(crop) => setForm((p) => ({ ...p, image_crop_settings: crop }))}
                  frameShape="rounded"
                  aspectPreset="16:9"
                />
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FormInput label="ชื่อผลงาน *" {...FI("title")} />
                </div>
              </div>

              <FormTextarea label="รายละเอียด" rows={3} {...FT("description")} />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormSelect
                  label="ประเภทผลงาน"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  options={formCategoryOptions}
                />
                <FormInput label="ปี (เช่น 2566)" {...FI("year")} />
              </div>

              <FormInput label="ชื่ออาจารย์เจ้าของผลงาน" {...FI("teacher_name")} />

              <div className="rounded-2xl border border-slate-200 p-4">
                <Label>อัปโหลด PDF ไปยัง Cloudflare R2</Label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      setPdfFile(e.target.files?.[0] ?? null);
                      setPdfUploadMessage(null);
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handlePdfUpload}
                    disabled={!pdfFile || pdfUploading}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {pdfUploading ? "กำลังอัปโหลด..." : "อัปโหลด PDF"}
                  </button>
                </div>
                {form.pdf_filename && (
                  <p className="mt-2 text-xs text-slate-500">ไฟล์ PDF ปัจจุบัน: {form.pdf_filename}</p>
                )}
                {pdfUploadMessage && (
                  <p className={`mt-2 text-xs ${pdfUploadMessage.ok ? "text-emerald-600" : "text-rose-600"}`}>
                    {pdfUploadMessage.msg}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  อัปโหลดแล้วต้องกดบันทึกผลงานเพื่อเก็บ path ไฟล์ PDF
                </p>
              </div>

              <details className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                  ตัวเลือกขั้นสูง
                </summary>
                <p className="mt-2 text-xs text-slate-500">
                  ปกติไม่ต้องกรอก ส่วนนี้ใช้เฉพาะกรณีมีลิงก์ภายนอกหรือข้อมูลจากระบบอื่น
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>แหล่งที่มา</Label>
                    <FormSelect
                      label=""
                      value={form.source_type}
                      onChange={(e) => setForm((p) => ({ ...p, source_type: e.target.value }))}
                      options={[
                        { value: "internal", label: "ภายใน (อัปโหลดเอง)" },
                        { value: "external", label: "ภายนอก (ลิงก์)" },
                      ]}
                    />
                  </div>
                  <FormInput label="ระบบที่มา (เช่น TCI, Scopus)" {...FI("source_system")} />
                  <FormInput label="URL โปรเจกต์" {...FI("project_url")} />
                  <div>
                    <FormInput label="URL ภายนอก" {...FI("external_url")} />
                    {form.source_type === "external" && !form.external_url && (
                      <p className="text-xs text-amber-600 mt-1">
                        แนะนำ: กรอก URL ภายนอกสำหรับผลงานที่มาจากลิงก์
                      </p>
                    )}
                  </div>
                  <FormInput label="URL รูปภาพ" {...FI("image_url")} />
                  <FormInput label="Alt รูปภาพ" {...FI("image_alt")} />
                  <div>
                    <Label>URL / Path ไฟล์ PDF</Label>
                    <input
                      value={form.pdf_url}
                      readOnly
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-600"
                    />
                  </div>
                  <div>
                    <Label>ชื่อไฟล์ PDF ตอนดาวน์โหลด</Label>
                    <input
                      value={form.pdf_filename}
                      readOnly
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-600"
                    />
                  </div>
                </div>
              </details>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-500"
                  />
                  <span className="text-sm text-slate-700">ผลงานเด่น</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded accent-brand-500"
                  />
                  <span className="text-sm text-slate-700">แสดงในเว็บไซต์</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="h-10 px-5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 px-6 rounded-xl text-sm font-medium text-white bg-brand-gradient shadow-brand hover:opacity-95 transition disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มผลงาน"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmId}
        title="ต้องการลบผลงานนี้ถาวรหรือไม่?"
        description="การลบนี้จะลบรายการออกจากฐานข้อมูลจริง ไม่ใช่แค่ซ่อนจากเว็บไซต์"
        variant="danger"
        confirmLabel="ลบถาวร"
        onClose={() => setConfirmId(null)}
        onConfirm={handleDelete}
      />

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
            toast.ok ? "bg-slate-900" : "bg-rose-600"
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
