"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, GraduationCap, KeyRound, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Form";
import { siteData } from "@/data/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getRecoveryTokensFromHash() {
  if (typeof window === "undefined" || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const error = params.get("error") || params.get("error_description");
  if (error) return { status: "error" as const };

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");

  if (!accessToken || !refreshToken || type !== "recovery") return null;

  return {
    status: "tokens" as const,
    accessToken,
    refreshToken,
  };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createBrowserSupabaseClient();
    const authError = searchParams.get("error") || searchParams.get("error_description");
    const code = searchParams.get("code");

    const finish = (valid: boolean) => {
      if (!mounted) return;
      setHasRecoverySession(valid);
      setCheckingSession(false);
      if (!valid) {
        setError("ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง");
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session && mounted) {
        setHasRecoverySession(true);
        setCheckingSession(false);
        setError(null);
      }
    });

    async function initializeRecoverySession() {
      const hashResult = getRecoveryTokensFromHash();

      if (hashResult?.status === "error") {
        finish(false);
        return;
      }

      if (hashResult?.status === "tokens") {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: hashResult.accessToken,
          refresh_token: hashResult.refreshToken,
        });
        if (sessionError || !data.session) {
          finish(false);
          return;
        }
        window.history.replaceState(null, "", "/reset-password");
        finish(true);
        return;
      }

      if (authError) {
        finish(false);
        return;
      }

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.session) {
          finish(false);
          return;
        }
        window.history.replaceState(null, "", "/reset-password");
        finish(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      finish(Boolean(data.session));
    }

    initializeRecoverySession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!hasRecoverySession) {
      setError("ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("ไม่สามารถตั้งรหัสผ่านใหม่ได้ กรุณาขอลิงก์ใหม่อีกครั้ง");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSuccess(true);
  };

  return (
    <div className="w-full max-w-md">
      <div className="lg:hidden mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient grid place-items-center text-white">
            <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-slate-900">{siteData.shortName}</span>
        </Link>
      </div>

      <h2 className="text-2xl font-semibold text-slate-900">ตั้งรหัสผ่านใหม่</h2>
      <p className="text-sm text-slate-500 mt-1">
        กำหนดรหัสผ่านใหม่สำหรับบัญชีผู้ดูแลเว็บไซต์
      </p>

      {checkingSession ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          กำลังตรวจสอบลิงก์ตั้งรหัสผ่านใหม่...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormInput
            label="รหัสผ่านใหม่"
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FormInput
            label="ยืนยันรหัสผ่านใหม่"
            type="password"
            placeholder="ยืนยันรหัสผ่านใหม่"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" size="lg" fullWidth disabled={loading || success || !hasRecoverySession}>
            {loading ? <KeyRound className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-slate-500 hover:text-brand-600 transition">
          ← กลับไปเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
            ใช้ลิงก์จากอีเมลเพื่อกำหนดรหัสผ่านใหม่อย่างปลอดภัย
          </p>
        </div>
        <div className="relative text-sm opacity-80">
          © {new Date().getFullYear()} {siteData.universityName}
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-14">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              กำลังโหลด...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
