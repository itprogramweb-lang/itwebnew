"use client";
import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  disabled?: boolean;
  endpoint?: string;
};

export default function CloudinaryImageUploader({
  value,
  onChange,
  folder = "uploads",
  label = "อัปโหลดรูปภาพ",
  disabled = false,
  endpoint = "/api/admin/cloudinary/upload",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setError("ไฟล์ต้องเป็น JPG, PNG หรือ WebP เท่านั้น");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Upload failed: ${res.status}`);
      }

      const json = await res.json();
      onChange(json.secure_url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* preview */}
      {value && (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              onChange("");
              setSuccess(false);
              setError(null);
            }}
            disabled={disabled || uploading}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* upload area */}
      <div
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition
          ${
            disabled || uploading
              ? "opacity-50 cursor-not-allowed border-slate-200"
              : "border-slate-300 hover:border-brand-400 hover:bg-brand-50"
          }`}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-2 text-slate-500">
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <p className="text-sm">กำลังอัปโหลด...</p>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-slate-400">JPG, PNG, WebP · สูงสุด 5MB</p>
            </>
          )}
        </div>
      </div>

      {success && (
        <p className="text-xs text-emerald-600 font-medium">อัปโหลดสำเร็จแล้ว</p>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
