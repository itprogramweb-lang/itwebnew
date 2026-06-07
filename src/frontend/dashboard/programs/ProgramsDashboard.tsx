"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import {
  AddButton,
  DashboardPageHeader,
  EmptyRow,
  FilterSelect,
  SearchFilter,
  TableShell,
  Td,
  Th,
} from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormCheckbox, FormInput, FormSelect, FormTextarea } from "@/components/ui/Form";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cropToJson, getDefaultImageCrop, type ImageCropSettings } from "@/lib/imageCrop";

type ProgramRow = {
  id: string;
  level: string;
  title: string;
  degree_name: string | null;
  duration: string | null;
  credits: number | null;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings: Record<string, unknown> | null;
  curriculum_url: string | null;
  details: Record<string, unknown> | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProgramForm = {
  level: string;
  title: string;
  degree_name: string;
  duration: string;
  credits: string;
  description: string;
  image_url: string;
  image_alt: string;
  image_crop_settings: ImageCropSettings;
  curriculum_url: string;
  details_content: string;
  is_active: boolean;
};

type ProgramsResponse = {
  programs?: ProgramRow[];
  program?: ProgramRow;
  error?: string;
};

const EMPTY_FORM: ProgramForm = {
  level: "bachelor",
  title: "",
  degree_name: "",
  duration: "",
  credits: "",
  description: "",
  image_url: "",
  image_alt: "",
  image_crop_settings: getDefaultImageCrop({
    frameShape: "rounded",
    aspectPreset: "16:9",
  }),
  curriculum_url: "",
  details_content: "",
  is_active: true,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainTextToHtml(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return "";

  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const isBulletList = lines.length > 1 && lines.every((line) => /^[-•]\s+/.test(line));
      const isNumberList = lines.length > 1 && lines.every((line) => /^\d+[\).]\s+/.test(line));

      if (isBulletList) {
        return `<ul>${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^[-•]\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }

      if (isNumberList) {
        return `<ol>${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^\d+[\).]\s+/, ""))}</li>`)
          .join("")}</ol>`;
      }

      return `<p>${escapeHtml(block).replaceAll("\n", "<br>")}</p>`;
    })
    .join("");
}

function valueToHtml(value: unknown, depth = 0): string {
  if (value === null || value === undefined || value === "") return "";

  if (typeof value === "string") {
    if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
    return plainTextToHtml(value);
  }

  if (Array.isArray(value)) {
    return `<ul>${value.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .filter(([, subValue]) => subValue !== null && subValue !== undefined && subValue !== "")
      .map(([key, subValue]) => {
        const tag = depth === 0 ? "h2" : "h3";
        return `<${tag}>${escapeHtml(key)}</${tag}>${valueToHtml(subValue, depth + 1)}`;
      })
      .join("");
  }

  return plainTextToHtml(String(value));
}

function detailsToHtml(details: Record<string, unknown> | null) {
  if (!details) return "";

  if (typeof details.content === "string") {
    return details.content;
  }

  if (Array.isArray(details.sections)) {
    return details.sections
      .filter((item): item is Record<string, unknown> => isPlainObject(item))
      .map((item) => {
        const title = typeof item.title === "string" ? item.title : "";
        const content = item.content ?? "";
        return `${title ? `<h2>${escapeHtml(title)}</h2>` : ""}${valueToHtml(content)}`;
      })
      .join("");
  }

  return Object.entries(details)
    .filter(([key]) => key !== "version")
    .map(([key, value]) => `<h2>${escapeHtml(key)}</h2>${valueToHtml(value)}`)
    .join("");
}

function htmlToPlainText(html: string) {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function extractCreditsFromHtml(html: string) {
  const text = htmlToPlainText(html);

  const totalMatch =
    text.match(/รวม(?:ตลอดหลักสูตร)?[^0-9]*(\d{2,3})\s*หน่วยกิต/i) ||
    text.match(/หน่วยกิตรวม(?:ตลอดหลักสูตร)?[^0-9]*(\d{2,3})/i);

  if (totalMatch?.[1]) return totalMatch[1];

  return "";
}

function toForm(program: ProgramRow): ProgramForm {
  return {
    level: program.level || "bachelor",
    title: program.title || "",
    degree_name: program.degree_name || "",
    duration: program.duration || "",
    credits: program.credits === null ? "" : String(program.credits),
    description: program.description || "",
    image_url: program.image_url || "",
    image_alt: program.image_alt || "",
    image_crop_settings: cropToJson(program.image_crop_settings),
    curriculum_url: program.curriculum_url || "",
    details_content: detailsToHtml(program.details),
    is_active: program.is_active !== false,
  };
}

function formToPayload(form: ProgramForm) {
  const extractedCredits = extractCreditsFromHtml(form.details_content);
  const finalCredits = form.credits.trim() || extractedCredits;

  return {
    level: form.level,
    title: form.title.trim(),
    degree_name: form.degree_name.trim() || null,
    duration: form.duration.trim() || null,
    credits: finalCredits ? Number(finalCredits) : null,
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    image_alt: form.image_alt.trim() || null,
    image_crop_settings: cropToJson(form.image_crop_settings),
    curriculum_url: form.curriculum_url.trim() || null,
    details: {
      version: 3,
      content: cleanHtmlBeforeSave(form.details_content).trim(),
    },
    is_active: form.is_active,
  };
}

function cleanHtmlBeforeSave(html: string) {
  if (typeof window === "undefined") return html;

  const div = document.createElement("div");
  div.innerHTML = html;

  div.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const tagName = el.tagName.toLowerCase();
    const oldClassName = el.className;

    const textAlign = el.style.textAlign;

    const width = el.style.width;
    const height = el.style.height;
    const display = el.style.display;
    const aspectRatio = el.style.aspectRatio;
    const overflow = el.style.overflow;
    const borderRadius = el.style.borderRadius;
    const background = el.style.background;
    const objectFit = el.style.objectFit;
    const objectPosition = el.style.objectPosition;
    const transform = el.style.transform;
    const transformOrigin = el.style.transformOrigin;
    const margin = el.style.margin;
    const boxShadow = el.style.boxShadow;

    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("face");
    el.removeAttribute("size");
    el.removeAttribute("color");

    if (textAlign === "left" || textAlign === "center" || textAlign === "right") {
      el.style.textAlign = textAlign;
    }

    if (oldClassName === "news-crop-frame") {
      el.className = "news-crop-frame";

      if (display) el.style.display = display;
      if (aspectRatio) el.style.aspectRatio = aspectRatio;
      if (overflow) el.style.overflow = overflow;
      if (borderRadius) el.style.borderRadius = borderRadius;
      if (background) el.style.background = background;
    }

    if (tagName === "img") {
      if (width) el.style.width = width;
      if (height) el.style.height = height;
      if (objectFit) el.style.objectFit = objectFit;
      if (objectPosition) el.style.objectPosition = objectPosition;
      if (transform) el.style.transform = transform;
      if (transformOrigin) el.style.transformOrigin = transformOrigin;
      if (margin) el.style.margin = margin;
      if (borderRadius) el.style.borderRadius = borderRadius;
      if (boxShadow) el.style.boxShadow = boxShadow;
    }
  });

  return div.innerHTML;
}
async function getAuthHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function ProgramsDashboard() {
  const [items, setItems] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hideId, setHideId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(EMPTY_FORM);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/programs", { headers });
      const data = (await res.json()) as ProgramsResponse;

      if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดหลักสูตรได้");

      setItems(data.programs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดหลักสูตรได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((item) => {
      const text = [item.title, item.degree_name, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchQ = !query || text.includes(query);
      const matchLevel = level === "all" || item.level === level;
      const matchStatus =
        status === "all" ||
        (status === "active" && item.is_active !== false) ||
        (status === "inactive" && item.is_active === false);

      return matchQ && matchLevel && matchStatus;
    });
  }, [items, q, level, status]);
  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      image_crop_settings: getDefaultImageCrop({
        frameShape: "rounded",
        aspectPreset: "16:9",
      }),
      details_content: "",
    });
    setNotice(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (program: ProgramRow) => {
    setEditingId(program.id);
    setForm(toForm(program));
    setNotice(null);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("กรุณากรอกชื่อหลักสูตร");
      return;
    }

    const extractedCredits = extractCreditsFromHtml(form.details_content);
    const finalCredits = form.credits.trim() || extractedCredits;

    if (finalCredits && Number.isNaN(Number(finalCredits))) {
      setError("หน่วยกิตต้องเป็นตัวเลข");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();
      const isEdit = !!editingId;
      const payload = formToPayload(form);

      const res = await fetch("/api/admin/programs", {
        method: isEdit ? "PATCH" : "POST",
        headers,
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });

      const data = (await res.json()) as ProgramsResponse;

      if (!res.ok || !data.program) {
        throw new Error(data.error || "ไม่สามารถบันทึกหลักสูตรได้");
      }

      setItems((prev) =>
        isEdit
          ? prev.map((item) => (item.id === data.program!.id ? data.program! : item))
          : [data.program!, ...prev]
      );

      setModalOpen(false);
      setNotice(isEdit ? "บันทึกหลักสูตรเรียบร้อยแล้ว" : "เพิ่มหลักสูตรเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกหลักสูตรได้");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();

      const res = await fetch(`/api/admin/programs?id=${encodeURIComponent(deleteId)}`, {
        method: "DELETE",
        headers,
      });

      const data = (await res.json()) as ProgramsResponse;

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถลบหลักสูตรได้");
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteId));
      setNotice("ลบหลักสูตรเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถลบหลักสูตรได้");
    } finally {
      setSaving(false);
      setDeleteId(null);
    }
  };

  const handleHide = async () => {
    if (!hideId) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();

      const target = items.find((item) => item.id === hideId);

      if (!target) {
        throw new Error("ไม่พบข้อมูลหลักสูตรที่ต้องการซ่อน");
      }

      const res = await fetch("/api/admin/programs", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: hideId,
          level: target.level,
          title: target.title,
          degree_name: target.degree_name,
          duration: target.duration,
          credits: target.credits,
          description: target.description,
          image_url: target.image_url,
          image_alt: target.image_alt,
          image_crop_settings: target.image_crop_settings,
          curriculum_url: target.curriculum_url,
          details: target.details,
          is_active: false,
        }),
      });

      const data = (await res.json()) as ProgramsResponse;

      if (!res.ok || !data.program) {
        throw new Error(data.error || "ไม่สามารถซ่อนหลักสูตรได้");
      }

      setItems((prev) =>
        prev.map((item) => (item.id === data.program!.id ? data.program! : item))
      );

      setNotice("ซ่อนหลักสูตรเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถซ่อนหลักสูตรได้");
    } finally {
      setSaving(false);
      setHideId(null);
    }
  };

  const handleToggleActive = async (program: ProgramRow) => {
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const headers = await getAuthHeaders();
      const nextActive = program.is_active === false;

      const res = await fetch("/api/admin/programs", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: program.id,
          level: program.level,
          title: program.title,
          degree_name: program.degree_name,
          duration: program.duration,
          credits: program.credits,
          description: program.description,
          image_url: program.image_url,
          image_alt: program.image_alt,
          image_crop_settings: program.image_crop_settings,
          curriculum_url: program.curriculum_url,
          details: program.details,
          is_active: nextActive,
        }),
      });

      const data = (await res.json()) as ProgramsResponse;

      if (!res.ok || !data.program) {
        throw new Error(data.error || "ไม่สามารถเปลี่ยนสถานะหลักสูตรได้");
      }

      setItems((prev) =>
        prev.map((item) => (item.id === data.program!.id ? data.program! : item))
      );

      setNotice(nextActive ? "เปิดแสดงหลักสูตรเรียบร้อยแล้ว" : "ซ่อนหลักสูตรเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะหลักสูตรได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardPageHeader
        title="หลักสูตร"
        description={`ทั้งหมด ${items.length} หลักสูตร · แสดงอยู่ ${items.filter((item) => item.is_active !== false).length
          }`}
        action={<AddButton label="เพิ่มหลักสูตร" onClick={openAdd} />}
      />

      {notice && <StatusBox type="success" message={notice} />}
      {error && <StatusBox type="error" message={error} />}

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากชื่อหลักสูตรหรือปริญญา...">
        <FilterSelect
          value={level}
          onChange={setLevel}
          options={[
            { value: "all", label: "ทุกระดับ" },
            { value: "bachelor", label: "ปริญญาตรี" },
            { value: "master", label: "ปริญญาโท" },
          ]}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
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
            <Th>หลักสูตร</Th>
            <Th>ระดับ</Th>
            <Th>ระยะเวลา</Th>
            <Th>หน่วยกิต</Th>
            <Th>สถานะ</Th>
            <Th className="text-right">จัดการ</Th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow colSpan={6} label="กำลังโหลดหลักสูตร..." />
          ) : filtered.length === 0 ? (
            <EmptyRow colSpan={6} />
          ) : (
            filtered.map((program) => (
              <tr key={program.id} className="hover:bg-slate-50/50">
                <Td>
                  <div className="line-clamp-1 font-medium text-slate-900">
                    {program.title}
                  </div>
                  <div className="line-clamp-1 text-xs text-slate-500">
                    {program.degree_name || program.description || "-"}
                  </div>
                </Td>

                <Td className="whitespace-nowrap text-xs text-slate-600">
                  {program.level === "master" ? "ปริญญาโท" : "ปริญญาตรี"}
                </Td>

                <Td className="text-xs text-slate-600">{program.duration || "-"}</Td>

                <Td className="text-xs text-slate-600">{program.credits ?? "-"}</Td>

                <Td>
                  <StatusPill active={program.is_active !== false} />
                </Td>

                <Td className="text-right">
                  <div className="inline-flex gap-1">

                    <button
                      onClick={() => handleToggleActive(program)}
                      className={
                        program.is_active !== false
                          ? "p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                          : "p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition"
                      }
                      title={program.is_active !== false ? "กดเพื่อซ่อนหลักสูตร" : "กดเพื่อเปิดแสดงหลักสูตร"}
                    >
                      {program.is_active !== false ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>

                                        <button
                      onClick={() => openEdit(program)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition"
                      title="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setDeleteId(program.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      title="ลบถาวร"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
          <div className="mx-auto my-6 w-full max-w-6xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {editingId ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตร"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    เขียนรายละเอียดในช่องเดียว แล้วเลือกข้อความเพื่อปรับเป็น H1 / H2 / H3 ได้
                  </p>
                </div>
              </div>

              <button
                onClick={() => !saving && setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[0.85fr_1.45fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    ข้อมูลพื้นฐานหลักสูตร
                  </h3>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormSelect
                        label="ระดับ"
                        value={form.level}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, level: e.target.value }))
                        }
                        options={[
                          { value: "bachelor", label: "ปริญญาตรี" },
                          { value: "master", label: "ปริญญาโท" },
                        ]}
                      />

                      <FormInput
                        label="ชื่อหลักสูตร"
                        required
                        value={form.title}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </div>

                    <FormInput
                      label="ชื่อปริญญา"
                      value={form.degree_name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, degree_name: e.target.value }))
                      }
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormInput
                        label="ระยะเวลา"
                        value={form.duration}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, duration: e.target.value }))
                        }
                      />

                      <FormInput
                        label="หน่วยกิต"
                        type="number"
                        value={form.credits}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, credits: e.target.value }))
                        }
                      />
                    </div>

                    <FormTextarea
                      label="รายละเอียดสั้น"
                      rows={4}
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />

                    <FormInput
                      label="URL เอกสารหลักสูตร"
                      value={form.curriculum_url}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, curriculum_url: e.target.value }))
                      }
                    />

                    <FormCheckbox
                      label="แสดงในเว็บไซต์"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">
                    รูปภาพหลักสูตร
                  </h3>

                  <div className="space-y-4">
                    <CloudinaryImageUploader
                      value={form.image_url}
                      onChange={(url) =>
                        setForm((prev) => ({ ...prev, image_url: url }))
                      }
                      folder="programs"
                      label="อัปโหลดรูปหลักสูตร"
                    />

                    {form.image_url && (
                      <ImageCropControls
                        imageUrl={form.image_url}
                        alt={form.image_alt || form.title || "program image"}
                        value={form.image_crop_settings}
                        onChange={(crop) =>
                          setForm((prev) => ({
                            ...prev,
                            image_crop_settings: crop,
                          }))
                        }
                        frameShape="rounded"
                        aspectPreset="16:9"
                      />
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormInput
                        label="URL รูปภาพ"
                        value={form.image_url}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            image_url: e.target.value,
                          }))
                        }
                      />

                      <FormInput
                        label="Alt รูปภาพ"
                        value={form.image_alt}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            image_alt: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      รายละเอียดหลักสูตร
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      เขียนทุกอย่างในช่องเดียว แล้วเลือกข้อความเพื่อกด H1 / H2 / H3 เป็นหัวข้อได้ภายหลัง
                    </p>
                  </div>
                </div>

                <RichTextEditor
                  value={form.details_content}
                  onChange={(html) =>
                    setForm((prev) => ({
                      ...prev,
                      details_content: html,
                    }))
                  }
                  placeholder="เขียนรายละเอียดหลักสูตรที่นี่... เช่น ข้อมูลหลักสูตร โครงสร้างหลักสูตร แผนการศึกษา คุณสมบัติ แนวทางอาชีพ"
                  minHeight={650}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <Button
                variant="ghost"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                ยกเลิก
              </Button>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!hideId}
        title="ซ่อนหลักสูตรนี้?"
        description="หลักสูตรจะถูกตั้งค่า is_active = false และจะไม่แสดงในหน้าเว็บไซต์ แต่ข้อมูลยังอยู่ในระบบ"
        variant="warning"
        confirmLabel="ซ่อน"
        onClose={() => setHideId(null)}
        onConfirm={handleHide}
      />

      <ConfirmModal
        open={!!deleteId}
        title="ลบหลักสูตรนี้ถาวร?"
        description="การลบนี้จะลบข้อมูลออกจากฐานข้อมูลจริง และไม่สามารถกู้คืนจากหน้านี้ได้"
        variant="danger"
        confirmLabel="ลบถาวร"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />



    </div>
  );
}

function StatusBox({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const ok = type === "success";

  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${ok
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-rose-200 bg-rose-50 text-rose-700"
        }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-100 text-slate-500"
        }`}
    >
      {active ? "แสดง" : "ซ่อน"}
    </span>
  );
}
