"use client";
import { useState } from "react";
import { FormInput, FormTextarea } from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL: FormState = { name: "", email: "", subject: "", message: "" };

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setError("กรุณากรอกชื่อและรายละเอียดให้ครบ");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          subject: form.subject.trim() || null,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `ส่งไม่สำเร็จ: ${res.status}`);
      }
      setSuccess(true);
      setForm(INITIAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500 grid place-items-center text-white">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-emerald-900 text-lg">ส่งข้อมูลแล้ว</h3>
        <p className="text-sm text-emerald-700 mt-2">
          เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด
        </p>
        <button
          onClick={() => { setSuccess(false); setForm(INITIAL); }}
          className="mt-5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ส่งข้อความใหม่
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          label="ชื่อ"
          required
          placeholder="ชื่อ-นามสกุล"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
        <FormInput
          label="อีเมล"
          type="email"
          placeholder="example@email.com"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
      </div>
      <FormInput
        label="หัวข้อ"
        placeholder="หัวข้อที่ต้องการติดต่อ"
        value={form.subject}
        onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
      />
      <FormTextarea
        label="รายละเอียด"
        required
        rows={5}
        placeholder="กรอกรายละเอียดที่ต้องการสอบถาม..."
        value={form.message}
        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
      />

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" size="lg" fullWidth disabled={loading}>
        <Send className="w-4 h-4" />
        {loading ? "กำลังส่ง..." : "ส่งข้อความ"}
      </Button>
    </form>
  );
}
