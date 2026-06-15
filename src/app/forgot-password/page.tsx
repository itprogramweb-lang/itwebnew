"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, GraduationCap, Mail, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Form";
import { siteData } from "@/data/site";

const GENERIC_RESET_MESSAGE =
  "หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมล";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      setSent(true);
      setEmail("");
    } catch {
      setError("ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <div className="lg:w-1/2 relative bg-brand-gradient text-white p-8 lg:p-14 overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-brand-mesh opacity-30" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-amber-300/30 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2.5 w-fit">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur grid place-items-center">
            <GraduationCap className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-semibold leading-tight">{siteData.shortName}</div>
            <div className="text-xs opacity-90">{siteData.universityName}</div>
          </div>
        </Link>

        <div className="relative my-auto py-12">
          <h1 className="max-w-md text-3xl font-semibold leading-tight lg:text-5xl">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="mt-4 text-white/90 max-w-md leading-relaxed">
            รับลิงก์สำหรับตั้งรหัสผ่านใหม่ผ่านอีเมลบัญชีผู้ดูแลเว็บไซต์
          </p>
        </div>
        <div className="relative text-sm opacity-80">
          © {new Date().getFullYear()} {siteData.universityName}
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-14">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-gradient grid place-items-center text-white">
                <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-slate-900">{siteData.shortName}</span>
            </Link>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">ลืมรหัสผ่าน?</h2>
          <p className="text-sm text-slate-500 mt-1">
            กรอกอีเมลบัญชีผู้ดูแลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <FormInput
              label="อีเมล"
              type="email"
              placeholder="you@rmutt.ac.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {sent && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{GENERIC_RESET_MESSAGE}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              {loading ? <Mail className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {loading ? "กำลังส่งคำขอ..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-brand-600 transition">
              ← กลับไปเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
