"use client";

import { useState } from "react";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
} from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import {
  AlertCircle,
  CheckCircle2,
  Send,
  Upload,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import type { ComplaintType } from "@/types";

const complaintCategoryOptions = [
  {
    value: "suggestion",
    label: "ข้อเสนอแนะ",
  },
  {
    value: "teaching",
    label: "การจัดการเรียนการสอนของอาจารย์",
  },
  {
    value: "staff_operation",
    label: "การดำเนินงานของเจ้าหน้าที่",
  },
  {
    value: "harassment_rights",
    label: "การคุกคามและการละเมิดสิทธิ์",
  },
  {
    value: "place_environment",
    label: "สถานที่และสภาพแวดล้อม",
  },
  {
    value: "other",
    label: "อื่นๆ",
  },
];

const initialState = {
  complaint_type: "suggestion" as ComplaintType,
  title: "",
  detail: "",
  sender_name: "",
  student_id: "",
  email: "",
  phone: "",
  want_contact: false,
  attachment_url: "",
};

type ComplaintCreateResponse = {
  success?: boolean;
  complaint?: {
    id?: string;
    tracking_code?: string | null;
  };
  error?: string;
};

export default function ComplaintForm() {
  const [form, setForm] = useState(initialState);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadComplaintFile(file: File) {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

    if (!ALLOWED.includes(file.type)) {
      setUploadError("รองรับเฉพาะ JPG, PNG, WebP เท่านั้น");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError("ขนาดไฟล์ต้องไม่เกิน 3MB");
      return;
    }

    setUploadingFile(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/public/cloudinary/complaint-upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Upload failed: ${res.status}`);
      }

      const json = await res.json();

      setForm((prev) => ({
        ...prev,
        attachment_url: json.secure_url,
      }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadingFile(false);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.complaint_type || !form.title.trim() || !form.detail.trim()) {
      setError("กรุณากรอกประเภทข้อร้องเรียน หัวข้อ และรายละเอียดให้ครบ");
      return;
    }

    if (form.want_contact && !form.email.trim() && !form.phone.trim()) {
      setError(
        "หากต้องการให้เจ้าหน้าที่ติดต่อกลับ กรุณาระบุอีเมลหรือเบอร์โทรอย่างน้อย 1 ช่อง"
      );
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      complaint_type: form.complaint_type,
      title: form.title.trim(),
      detail: form.detail.trim(),
      sender_name: form.sender_name.trim() || null,
      student_id: form.student_id.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      want_contact: form.want_contact,
      attachment_url: form.attachment_url.trim() || null,
      status: "new",
    };

    try {
      const res = await fetch("/api/public/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as ComplaintCreateResponse;

      if (!res.ok || !data.success || !data.complaint?.tracking_code) {
        throw new Error(data.error || "ไม่สามารถส่งข้อมูลได้");
      }

      setSubmittedCode(data.complaint.tracking_code);
      setForm(initialState);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถส่งข้อมูลได้";

      setError(`ส่งข้อมูลไม่สำเร็จ: ${message}`);
    } finally {
      setLoading(false);
    }
  };

if (submittedCode) {
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500 text-white">
        <CheckCircle2 className="h-8 w-8" />
      </div>

      <h3 className="text-lg font-semibold text-emerald-900">
        ได้รับข้อมูลแล้ว ขอบคุณสำหรับการแจ้งเรื่อง
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-emerald-700">
        ข้อมูลของคุณถูกส่งเข้าสู่ระบบเรียบร้อยแล้ว
        ผู้รับผิดชอบจะพิจารณาตามขั้นตอนต่อไป
      </p>

      <div className="mx-auto mt-4 inline-flex flex-col rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm">
        <span className="text-emerald-700">รหัสติดตาม</span>
        <span className="font-semibold tracking-wide text-emerald-950">
          {submittedCode}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setSubmittedCode(null);
          setForm(initialState);
          setError(null);
        }}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        ส่งเรื่องใหม่
      </button>
    </div>
  );
}

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <FormSelect
        label="ประเภทข้อร้องเรียน"
        required
        value={form.complaint_type}
        onChange={(e) =>
          setForm({
            ...form,
            complaint_type: e.target.value as ComplaintType,
          })
        }
        options={complaintCategoryOptions}
      />

      <FormInput
        label="หัวข้อ"
        required
        placeholder="ระบุหัวข้อของเรื่องที่ต้องการแจ้ง"
        value={form.title}
        onChange={(e) =>
          setForm({
            ...form,
            title: e.target.value,
          })
        }
      />

      <FormTextarea
        label="รายละเอียด"
        required
        rows={6}
        placeholder="กรุณาระบุรายละเอียดของเรื่องที่ต้องการแจ้งให้ชัดเจน"
        value={form.detail}
        onChange={(e) =>
          setForm({
            ...form,
            detail: e.target.value,
          })
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

          <p className="text-sm leading-relaxed text-amber-900">
            ข้อมูลที่แจ้งต้องเป็นความจริง หากแจ้งข้อมูลเท็จเพื่อกลั่นแกล้งผู้อื่น
            อาจถูกดำเนินคดีตามระเบียบ
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 text-sm font-medium text-slate-700">
          ข้อมูลผู้แจ้ง{" "}
          <span className="font-normal text-slate-400">
            (ไม่บังคับ / สามารถปกปิดตัวตนได้)
          </span>
        </div>

        <div className="notranslate grid grid-cols-1 gap-4 sm:grid-cols-2" translate="no">
          <FormInput
            label="ชื่อ-นามสกุล"
            placeholder="ไม่บังคับ"
            value={form.sender_name}
            onChange={(e) =>
              setForm({
                ...form,
                sender_name: e.target.value,
              })
            }
          />

          <FormInput
            label="รหัสนักศึกษา"
            placeholder="ไม่บังคับ"
            value={form.student_id}
            onChange={(e) =>
              setForm({
                ...form,
                student_id: e.target.value,
              })
            }
          />

          <FormInput
            label="อีเมล"
            type="email"
            placeholder="ไม่บังคับ"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
          />

          <FormInput
            label="เบอร์โทร"
            placeholder="ไม่บังคับ"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="notranslate space-y-2" translate="no">
        <label className="block text-sm font-medium text-slate-700">
          ไฟล์แนบ{" "}
          <span className="font-normal text-slate-400">
            (ไม่บังคับ)
          </span>
        </label>

        {form.attachment_url ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            <span className="flex-1 truncate">
              อัปโหลดแล้ว
            </span>

            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  attachment_url: "",
                }))
              }
              className="p-1 transition hover:text-rose-600"
              aria-label="ลบไฟล์แนบ"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3 transition ${
              uploadingFile
                ? "cursor-not-allowed border-slate-200 opacity-50"
                : "border-slate-300 hover:border-brand-400 hover:bg-brand-50"
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploadingFile}
              onChange={(e) => {
                const f = e.target.files?.[0];

                if (f) {
                  uploadComplaintFile(f);
                }

                e.target.value = "";
              }}
            />

            {uploadingFile ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            ) : (
              <Upload className="h-4 w-4 text-slate-500" />
            )}

            <span className="text-sm text-slate-500">
              {uploadingFile
                ? "กำลังอัปโหลด..."
                : "แนบรูปภาพ JPG, PNG, WebP สูงสุด 3MB"}
            </span>
          </label>
        )}

        {uploadError && (
          <p className="text-xs text-rose-600">
            {uploadError}
          </p>
        )}

        <FormInput
          label="หรือวาง URL ไฟล์แนบ"
          placeholder="https://... (ไม่บังคับ)"
          value={form.attachment_url}
          onChange={(e) =>
            setForm({
              ...form,
              attachment_url: e.target.value,
            })
          }
        />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <FormCheckbox
          label="ต้องการให้เจ้าหน้าที่ติดต่อกลับ"
          checked={form.want_contact}
          onChange={(e) =>
            setForm({
              ...form,
              want_contact: e.target.checked,
            })
          }
        />

        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          หากเลือกข้อนี้ กรุณาระบุอีเมลหรือเบอร์โทรอย่างน้อย 1 ช่อง
          เพื่อให้เจ้าหน้าที่สามารถติดต่อกลับได้
        </p>
      </div>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={loading}>
        <Send className="h-4 w-4" />
        {loading ? "กำลังส่งข้อมูล..." : "ส่งเรื่องร้องเรียน"}
      </Button>
    </form>
  );
}
