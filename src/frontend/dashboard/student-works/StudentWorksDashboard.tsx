"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Pencil, Trash2, CheckCircle2, AlertCircle, Star, Upload } from "lucide-react";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import { studentWorksApi } from "@/frontend/api/studentWorks";
import { getAuthToken } from "@/frontend/api/http";
import { StudentWorkRow } from "@/lib/supabase/queries";
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
  academic_year: string;
  work_type: "course" | "final_project";
  course_id: string;
  course_name: string;
  students_raw: string;
  advisor_name: string;
  technologies_raw: string;
  image_url: string;
  image_alt: string;
  pdf_url: string;
  pdf_filename: string;
  image_crop_settings: ImageCropSettings;
  project_url: string;
  external_url: string;
  source_type: string;
  source_system: string;
  sort_order: string;
  is_featured: boolean;
  is_active: boolean;
};

type WorkTypeTab = "course" | "final_project";

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  category: "web",
  academic_year: "",
  work_type: "final_project",
  course_id: "",
  course_name: "",
  students_raw: "",
  advisor_name: "",
  technologies_raw: "",
  image_url: "",
  image_alt: "",
  pdf_url: "",
  pdf_filename: "",
  image_crop_settings: getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" }),
  project_url: "",
  external_url: "",
  source_type: "internal",
  source_system: "",
  sort_order: "",
  is_featured: false,
  is_active: true,
};

const CATEGORY_LABELS: Record<string, string> = {
  web: "เว็บแอป",
  mobile: "โมบายแอป",
  ai: "AI/Data",
  iot: "IoT",
  design: "Design",
  other: "อื่น ๆ",
};

const DEFAULT_CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

const categoryLabel = (value: string) => CATEGORY_LABELS[value] ?? value;

// ─── helpers ─────────────────────────────────────────────────────────────────

const splitArr = (s: string) =>
  s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean);

const isSafePdfPath = (value: string) => {
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith("//")) return false;
  if (!value.toLowerCase().endsWith(".pdf")) return false;
  if (value.startsWith("/")) return !value.split("/").some((part) => part === "." || part === "..");
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      return url.pathname.toLowerCase().endsWith(".pdf");
    } catch {
      return false;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return false;
  if (value.includes("\\")) return false;
  return !value.split("/").some((part) => !part || part === "." || part === "..");
};

const toForm = (w: StudentWorkRow): FormData => ({
  title: w.title,
  description: w.description ?? "",
  category: w.category ?? "web",
  academic_year: w.academic_year ?? "",
  work_type: w.work_type === "course" ? "course" : "final_project",
  course_id: w.course_id ?? "",
  course_name: w.course_name ?? "",
  students_raw: (w.students ?? []).join(", "),
  advisor_name: w.advisor_name ?? "",
  technologies_raw: (w.technologies ?? []).join(", "),
  image_url: w.image_url ?? "",
  image_alt: w.image_alt ?? "",
  pdf_url: w.pdf_url ?? "",
  pdf_filename: w.pdf_filename ?? "",
  image_crop_settings: cropToJson(w.image_crop_settings),
  project_url: w.project_url ?? "",
  external_url: w.external_url ?? "",
  source_type: w.source_type ?? "internal",
  source_system: w.source_system ?? "",
  sort_order: w.sort_order !== null ? String(w.sort_order) : "",
  is_featured: w.is_featured ?? false,
  is_active: w.is_active ?? true,
});

const toPayload = (f: FormData) => {
  const workType = f.work_type === "course" ? "course" : "final_project";

  return {
    title: f.title.trim(),
    description: f.description.trim() || null,
    category: f.category || null,
    academic_year: f.academic_year.trim() || null,
    work_type: workType,
    course_id: workType === "course" ? f.course_id.trim() : null,
    course_name: workType === "course" ? f.course_name.trim() : null,
    students: splitArr(f.students_raw),
    advisor_name: f.advisor_name.trim() || null,
    technologies: splitArr(f.technologies_raw),
    image_url: f.image_url.trim() || null,
    image_alt: f.image_alt.trim() || f.title.trim() || null,
    pdf_url: f.pdf_url.trim() || null,
    pdf_filename: f.pdf_filename.trim() || null,
    image_crop_settings: cropToJson(f.image_crop_settings),
    project_url: f.project_url.trim() || null,
    external_url: f.external_url.trim() || null,
    source_type: f.source_type || "internal",
    source_system: f.source_system.trim() || null,
    sort_order: f.sort_order !== "" ? Number(f.sort_order) : null,
    is_featured: f.is_featured,
    is_active: f.is_active,
  };
};

const validate = (f: FormData): string[] => {
  const errs: string[] = [];
  if (!f.title.trim()) errs.push("กรุณากรอกชื่อผลงาน");
  if (!f.academic_year.trim()) errs.push("กรุณากรอกปีการศึกษา");
  if (!["course", "final_project"].includes(f.work_type)) errs.push("กรุณาเลือกประเภทผลงาน");
  if (f.work_type === "course") {
    if (!f.course_id.trim()) errs.push("กรุณากรอกรหัสวิชา");
    if (!f.course_name.trim()) errs.push("กรุณากรอกชื่อวิชา");
  }
  if (f.pdf_url.trim() && !isSafePdfPath(f.pdf_url.trim())) {
    errs.push("URL หรือ path ไฟล์ PDF ไม่ถูกต้อง");
  }
  if (f.sort_order !== "" && isNaN(Number(f.sort_order)))
    errs.push("ลำดับต้องเป็นตัวเลข");
  return errs;
};

// ─── component ───────────────────────────────────────────────────────────────

export default function StudentWorksDashboard() {
  const [items, setItems] = useState<StudentWorkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [workTypeTab, setWorkTypeTab] = useState<WorkTypeTab>("final_project");
  const [categoryFilter, setCategoryFilter] = useState("all");
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
      const data = await studentWorksApi.list();
      setItems(data);
    } catch {
      showToast("โหลดข้อมูลไม่สำเร็จ", false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const typeCounts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const type = item.work_type === "course" ? "course" : "final_project";
        acc[type] += 1;
        return acc;
      },
      { course: 0, final_project: 0 }
    );
  }, [items]);

  const dataCategoryOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const item of items) {
      const type = item.work_type === "course" ? "course" : "final_project";
      if (type !== workTypeTab) continue;
      const value = item.category?.trim();
      if (value) seen.add(value);
    }
    return [...seen]
      .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "th"))
      .map((value) => ({ value, label: categoryLabel(value) }));
  }, [items, workTypeTab]);

  useEffect(() => {
    if (categoryFilter === "all") return;
    if (!dataCategoryOptions.some((option) => option.value === categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, dataCategoryOptions]);

  const formCategoryOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const option of DEFAULT_CATEGORY_OPTIONS) options.set(option.value, option.label);
    for (const option of dataCategoryOptions) options.set(option.value, option.label);
    return [...options].map(([value, label]) => ({ value, label }));
  }, [dataCategoryOptions]);

  const filtered = useMemo(() => {
    return items.filter((w) => {
      const needle = q.trim().toLowerCase();
      const workType = w.work_type === "course" ? "course" : "final_project";
      const haystack = [
        w.title,
        w.slug,
        w.description,
        w.category,
        workType,
        w.academic_year,
        (w.students ?? []).join(" "),
        w.advisor_name,
        (w.technologies ?? []).join(" "),
        w.course_id,
        w.course_name,
        w.pdf_filename,
        w.pdf_url,
        w.project_url,
        w.external_url,
        w.source_system,
        w.source_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQ =
        !needle || haystack.includes(needle);
      const category = w.category?.trim() ?? "";
      const matchWorkType = workType === workTypeTab;
      const matchCategory = categoryFilter === "all" || category === categoryFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? w.is_active !== false : w.is_active === false);
      return matchQ && matchWorkType && matchCategory && matchStatus;
    });
  }, [items, q, workTypeTab, categoryFilter, statusFilter]);

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
    setForm({ ...EMPTY_FORM, work_type: workTypeTab === "course" ? "course" : "final_project" });
    setErrors([]);
    setPdfFile(null);
    setPdfUploadMessage(null);
    setModalOpen(true);
  };

  const isCourseTab = workTypeTab === "course";
  const tableColSpan = isCourseTab ? 8 : 9;

  const openEdit = (w: StudentWorkRow) => {
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
    if (!form.academic_year.trim()) uploadErrors.push("กรุณากรอกปีการศึกษา");
    if (form.work_type === "course" && !form.course_id.trim()) uploadErrors.push("กรุณากรอกรหัสวิชา");

    if (uploadErrors.length > 0) {
      setPdfUploadMessage({ msg: uploadErrors[0], ok: false });
      return;
    }

    const workId = editingId;
    if (!workId) return;

    const data = new FormData();
    data.append("file", pdfFile!);
    data.append("work_id", workId);
    data.append("work_type", form.work_type);
    data.append("course_id", form.course_id);
    data.append("academic_year", form.academic_year);
    data.append("title", form.title);

    setPdfUploading(true);
    setPdfUploadMessage(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");

      const res = await fetch("/api/admin/student-works/upload-pdf", {
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
      setPdfUploadMessage({
        msg: err instanceof Error ? err.message : "อัปโหลดไฟล์ PDF ไม่สำเร็จ",
        ok: false,
      });
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
        const updated = await studentWorksApi.update(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        showToast("บันทึกเรียบร้อยแล้ว");
      } else {
        const created = await studentWorksApi.create(payload);
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
      await studentWorksApi.remove(confirmId);
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
        title="ผลงานนักศึกษา"
        description={`ปริญญานิพนธ์ (Thesis) ${typeCounts.final_project} รายการ / ผลงานรายวิชา ${typeCounts.course} รายการ`}
        action={<AddButton label="เพิ่มผลงาน" onClick={openAdd} />}
      />

      <div className="mb-4 max-w-full overflow-x-auto">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { value: "final_project" as const, label: "ปริญญานิพนธ์ (Thesis)", count: typeCounts.final_project },
            { value: "course" as const, label: "ผลงานรายวิชา", count: typeCounts.course },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setWorkTypeTab(tab.value)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                workTypeTab === tab.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${workTypeTab === tab.value ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาชื่อผลงาน รายวิชา นักศึกษา อาจารย์ PDF...">
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            { value: "all", label: "ทุกหมวด" },
            ...dataCategoryOptions,
          ]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "active", label: "แสดงอยู่" },
            { value: "all", label: "ทุกสถานะ" },
            { value: "inactive", label: "ซ่อนอยู่" },
          ]}
        />
      </SearchFilter>

      <TableShell>
        <thead className="bg-slate-50/60">
          <tr>
            <Th>ชื่อผลงาน</Th>
            {isCourseTab ? <Th>รายวิชา</Th> : <Th>ประเภท</Th>}
            <Th>นักศึกษา</Th>
            <Th>ที่ปรึกษา</Th>
            <Th>หมวด</Th>
            {!isCourseTab && <Th>ปีการศึกษา</Th>}
            <Th>PDF</Th>
            <Th>สถานะ</Th>
            <Th className="text-right">จัดการ</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow colSpan={tableColSpan} label="กำลังโหลด..." />
          ) : filtered.length === 0 ? (
            <EmptyRow colSpan={tableColSpan} />
          ) : (
            filtered.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      <CroppedImage
                        src={w.image_url ?? ""}
                        alt={w.image_alt ?? w.title}
                        fallbackSrc="/placeholders/student-work-placeholder.svg"
                        crop={w.image_crop_settings}
                        className="h-full w-full rounded-none"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 line-clamp-1 max-w-xs flex items-center gap-1">
                        {w.title}
                        {w.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      {(w.technologies ?? []).length > 0 && (
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {(w.technologies ?? []).join(", ")}
                        </div>
                      )}
                      {w.work_type === "course" && (
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                          {w.course_id ?? "-"} {w.course_name ?? ""}
                        </div>
                      )}
                    </div>
                  </div>
                </Td>
                {isCourseTab || w.work_type === "course" ? (
                  <Td className="text-slate-600 text-xs">
                    <div className="font-medium text-slate-800">{w.course_name ?? "-"}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{w.course_id ?? "-"}</div>
                  </Td>
                ) : (
                  <Td>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100">
                      ปริญญานิพนธ์ (Thesis)
                    </span>
                  </Td>
                )}
                <Td className="text-slate-600 text-xs">
                  {(w.students ?? []).join(", ") || "-"}
                </Td>
                <Td className="text-slate-600 text-xs">{w.advisor_name ?? "-"}</Td>
                <Td>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 border border-brand-100">
                    {CATEGORY_LABELS[w.category ?? ""] ?? w.category ?? "-"}
                  </span>
                </Td>
                {!isCourseTab && <Td className="text-slate-500 text-xs">{w.academic_year ?? "-"}</Td>}
                <Td>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      w.pdf_url
                        ? "bg-sky-50 text-sky-700 border border-sky-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {w.pdf_url ? "มี PDF" : "ไม่มี PDF"}
                  </span>
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
                    fallbackSrc="/placeholders/student-work-placeholder.svg"
                    crop={form.image_crop_settings}
                    className="h-full w-full rounded-none"
                  />
                </div>
              )}

              <CloudinaryImageUploader
                value={form.image_url}
                onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
                folder="student-works"
                label="อัปโหลดรูปผลงาน"
              />
              {form.image_url && (
                <ImageCropControls
                  imageUrl={form.image_url}
                  alt={form.image_alt || form.title || "student work"}
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
                  label="ประเภทผลงาน *"
                  value={form.work_type}
                  onChange={(e) => {
                    const value = e.target.value === "course" ? "course" : "final_project";
                    setForm((p) => ({
                      ...p,
                      work_type: value,
                      course_id: value === "course" ? p.course_id : "",
                      course_name: value === "course" ? p.course_name : "",
                    }));
                  }}
                  options={[
                    { value: "final_project", label: "ปริญญานิพนธ์ (Thesis)" },
                    { value: "course", label: "ผลงานรายวิชา" },
                  ]}
                />
                <FormSelect
                  label="หมวดหมู่"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  options={formCategoryOptions}
                />
                <FormInput
                  label={form.work_type === "course" ? "ปีการศึกษา (ใช้สำหรับจัดหน้า public)" : "ปีการศึกษา * (เช่น 2566)"}
                  {...FI("academic_year")}
                />
              </div>

              {form.work_type === "course" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormInput label="รหัสวิชา *" placeholder="09-142-306" {...FI("course_id")} />
                  <FormInput label="ชื่อวิชา *" placeholder="การพัฒนาเว็บยุคใหม่" {...FI("course_name")} />
                </div>
              )}

              <FormTextarea
                label="รายชื่อนักศึกษา (คั่นด้วย , หรือขึ้นบรรทัดใหม่)"
                rows={2}
                {...FT("students_raw")}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput label="ชื่ออาจารย์ที่ปรึกษา" {...FI("advisor_name")} />
              </div>

              <FormTextarea
                label="เทคโนโลยีที่ใช้ (คั่นด้วย , หรือขึ้นบรรทัดใหม่)"
                rows={2}
                {...FT("technologies_raw")}
              />

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
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handlePdfUpload}
                    disabled={pdfUploading}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
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
                  <FormInput label="ระบบที่มา (เช่น GitHub, Figma)" {...FI("source_system")} />
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
