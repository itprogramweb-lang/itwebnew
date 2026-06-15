"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LogIn,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { FormInput } from "@/components/ui/Form";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { siteData } from "@/data/site";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResetSuccess(params.get("reset") === "success");

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
        return;
      }
      setCheckingSession(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    router.replace("/dashboard");
  };

  if (checkingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="text-sm text-slate-500">กำลังตรวจสอบสถานะเข้าสู่ระบบ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left side - Brand */}
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
            ยินดีต้อนรับสู่ระบบหลังบ้าน
          </h1>
          <p className="mt-4 text-white/90 max-w-md leading-relaxed">
            จัดการเนื้อหาเว็บไซต์ ผลงาน ข่าวสาร และข้อร้องเรียน
            ในที่เดียว ออกแบบมาให้ง่ายและรวดเร็ว
          </p>

          <div className="mt-8 inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-2 rounded-full text-sm">
            <ShieldCheck className="w-4 h-4" />
            ระบบจัดการสำหรับผู้ดูแลเว็บไซต์
          </div>
        </div>
        <div className="relative text-sm opacity-80">
          © {new Date().getFullYear()} {siteData.universityName}
        </div>
      </div>

      {/* Right side - Form */}
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

          <h2 className="text-2xl font-semibold text-slate-900">เข้าสู่ระบบ</h2>
          <p className="text-sm text-slate-500 mt-1">
            สำหรับผู้ดูแลเว็บไซต์ กรุณาใช้อีเมลและรหัสผ่านที่ได้รับอนุญาต
          </p>

          {resetSuccess && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <span>ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <FormInput
                label="อีเมล"
                type="email"
                placeholder="you@rmutt.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <FormInput
                label="รหัสผ่าน"
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-brand-600 hover:text-brand-700 transition"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" fullWidth disabled={loading}>
              <LogIn className="w-4 h-4" />
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-brand-600 transition"
            >
              ← กลับสู่หน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
