"use client";
import { useState } from "react";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
} from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import { AlertCircle, CheckCircle2, Send, Lock, Upload, Loader2, X } from "lucide-react";
import type { ComplaintType } from "@/types";
import { complaintTypeLabels } from "@/data/complaints";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const initialState = {
  complaint_type: "complaint" as ComplaintType,
  title: "",
  detail: "",
  sender_name: "",
  student_id: "",
  email: "",
  phone: "",
  want_contact: false,
  attachment_url: "",
};

function generateTrackingCode() {
  const date = new Date();
  const yyyymmdd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CMP-${yyyymmdd}-${suffix}`;
}

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
      setForm((prev) => ({ ...prev, attachment_url: json.secure_url }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadingFile(false);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.complaint_type || !form.title.trim() || !form.detail.trim()) {
      setError("กรุณากรอกประเภทเรื่อง หัวข้อ และรายละเอียดให้ครบ");
      return;
    }

    setLoading(true);
    setError(null);

    const trackingCode = generateTrackingCode();
    const payload = {
      tracking_code: trackingCode,
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
      const supabase = createBrowserSupabaseClient();
      const { error: insertError } = await supabase.from("complaints").insert(payload);

      if (insertError) {
        throw insertError;
      }

      setSubmittedCode(trackingCode);
      setForm(initialState);
    } catch (err) {
      const message = err instanceof Error ? err.message : "ไม่สามารถส่งข้อมูลได้";
      setError(
        message.toLowerCase().includes("row-level security") || message.toLowerCase().includes("rls")
          ? `ส่งข้อมูลไม่สำเร็จ: Supabase RLS ไม่อนุญาตให้ insert complaints (${message})`
          : `ส่งข้อมูลไม่สำเร็จ: ${message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (submittedCode) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500 grid place-items-center text-white">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-emerald-900 text-lg">
          ได้รับข้อมูลแล้ว ขอบคุณสำหรับความคิดเห็นของคุณ
        </h3>
        <p className="text-sm text-emerald-700 mt-2">
          เลขที่เรื่องของคุณคือ
        </p>
        <div className="inline-block mt-2 px-4 py-2 rounded-xl bg-white border border-emerald-200 font-mono text-emerald-800 font-semibold">
          {submittedCode}
        </div>
        <p className="text-xs text-emerald-700 mt-4">
          เก็บเลขที่นี้ไว้สำหรับตรวจสอบสถานะในภายหลัง
        </p>
        <button
          onClick={() => {
            setSubmittedCode(null);
            setForm(initialState);
            setError(null);
          }}
          className="mt-5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ส่งเรื่องใหม่
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Confidentiality notice */}
      <div className="flex gap-3 items-start p-4 bg-brand-50 border border-brand-100 rounded-2xl">
        <Lock className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
        <p className="text-sm text-brand-800 leading-relaxed">
          ข้อมูลของคุณจะถูกเก็บเป็นความลับ
          และใช้เพื่อการตรวจสอบ/ปรับปรุงคุณภาพการให้บริการเท่านั้น
        </p>
      </div>

      <FormSelect
        label="ประเภทเรื่อง"
        required
        value={form.complaint_type}
        onChange={(e) => setForm({ ...form, complaint_type: e.target.value as ComplaintType })}
        options={Object.entries(complaintTypeLabels).map(([value, label]) => ({
          value,
          label,
        }))}
      />

      <FormInput
        label="หัวข้อ"
        required
        placeholder="หัวข้อสั้น ๆ ที่อธิบายเรื่องนี้"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <FormTextarea
        label="รายละเอียด"
        required
        rows={6}
        placeholder="โปรดอธิบายเรื่องที่ต้องการแจ้งโดยละเอียด"
        value={form.detail}
        onChange={(e) => setForm({ ...form, detail: e.target.value })}
      />

      <div className="pt-2">
        <div className="text-sm font-medium text-slate-700 mb-3">
          ข้อมูลผู้ส่ง <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
        </div>
        <div className="notranslate grid grid-cols-1 sm:grid-cols-2 gap-4" translate="no">
          <FormInput
            label="ชื่อ-นามสกุล"
            placeholder="ระบุได้หากต้องการให้ติดต่อกลับ"
            value={form.sender_name}
            onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
          />
          <FormInput
            label="รหัสนักศึกษา"
            placeholder="เช่น 1xxxxx101"
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
          />
          <FormInput
            label="อีเมล"
            type="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <FormInput
            label="เบอร์โทร"
            placeholder="08x-xxx-xxxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>

      {/* File upload for attachment */}
      <div className="notranslate space-y-2" translate="no">
        <label className="block text-sm font-medium text-slate-700">
          ไฟล์แนบ <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
        </label>
        {form.attachment_url ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate flex-1">อัปโหลดแล้ว</span>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, attachment_url: "" }))}
              className="p-1 hover:text-rose-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition
            ${uploadingFile ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-300 hover:border-brand-400 hover:bg-brand-50"}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploadingFile}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadComplaintFile(f);
                e.target.value = "";
              }}
            />
            {uploadingFile ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            ) : (
              <Upload className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-sm text-slate-500">
              {uploadingFile ? "กำลังอัปโหลด..." : "แนบรูปภาพ JPG, PNG, WebP (สูงสุด 3MB)"}
            </span>
          </label>
        )}
        {uploadError && (
          <p className="text-xs text-rose-600">{uploadError}</p>
        )}
        <FormInput
          label="หรือวาง URL ไฟล์แนบ"
          placeholder="https://... (ไม่บังคับ)"
          value={form.attachment_url}
          onChange={(e) => setForm({ ...form, attachment_url: e.target.value })}
        />
      </div>

      <div className="bg-slate-50 rounded-2xl p-4">
        <FormCheckbox
          label="ต้องการให้เจ้าหน้าที่ติดต่อกลับ"
          checked={form.want_contact}
          onChange={(e) => setForm({ ...form, want_contact: e.target.checked })}
        />
      </div>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={loading}>
        <Send className="w-4 h-4" />
        {loading ? "กำลังส่งข้อมูล..." : "ส่งเรื่อง"}
      </Button>
    </form>
  );
}
