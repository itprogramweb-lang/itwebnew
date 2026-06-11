"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  Power,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LineStatusResponse = {
  line?: {
    connected: boolean;
    displayName: string | null;
    pictureUrl: string | null;
    notifyEnabled: boolean;
    linkedAt: string | null;
    revokedAt: string | null;
  };
  eligibility?: {
    isDepartmentHead: boolean;
  };
  error?: string;
};

type Notice = {
  tone: "success" | "error";
  message: string;
};

const emptyLineStatus: NonNullable<LineStatusResponse["line"]> = {
  connected: false,
  displayName: null,
  pictureUrl: null,
  notifyEnabled: false,
  linkedAt: null,
  revokedAt: null,
};

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

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function readCallbackNotice(): Notice | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const line = params.get("line");

  if (line === "connected") {
    return { tone: "success", message: "เชื่อม LINE สำเร็จ" };
  }

  if (line === "error") {
    return {
      tone: "error",
      message: "เชื่อม LINE ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }

  return null;
}

export default function AccountDashboard() {
  const [lineStatus, setLineStatus] = useState(emptyLineStatus);
  const [isDepartmentHead, setIsDepartmentHead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const addFriendUrl = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL;

  const eligibilityMessage = useMemo(() => {
    if (isDepartmentHead) {
      return "บัญชีนี้เป็นหัวหน้าสาขาปัจจุบัน หากเชื่อม LINE แล้ว ระบบจะส่งแจ้งเตือนข้อร้องเรียนผ่าน LINE ให้บัญชีนี้";
    }

    return "บัญชีนี้สามารถเชื่อม LINE ได้ แต่จะได้รับแจ้งเตือนข้อร้องเรียนเฉพาะเมื่อเป็นหัวหน้าสาขาปัจจุบันเท่านั้น";
  }, [isDepartmentHead]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/account/line/status", { headers });
      const data = (await res.json().catch(() => ({}))) as LineStatusResponse;

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถโหลดสถานะ LINE ได้");
      }

      setLineStatus(data.line ?? emptyLineStatus);
      setIsDepartmentHead(data.eligibility?.isDepartmentHead === true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดสถานะ LINE ได้");
      setLineStatus(emptyLineStatus);
      setIsDepartmentHead(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotice(readCallbackNotice());
    loadStatus();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/account/line/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({
          redirect_path: "/dashboard/account",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        authorizationUrl?: string;
        error?: string;
      };

      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "ไม่สามารถเริ่มเชื่อม LINE ได้");
      }

      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเริ่มเชื่อม LINE ได้");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/account/line/disconnect", {
        method: "DELETE",
        headers,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถยกเลิกการเชื่อม LINE ได้");
      }

      setNotice({
        tone: "success",
        message: "ยกเลิกการเชื่อม LINE แล้ว",
      });
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถยกเลิกการเชื่อม LINE ได้");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {notice && (
        <div
          className={cn(
            "mb-4 flex items-start gap-2 rounded-2xl border p-3 text-sm",
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          )}
        >
          {notice.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900">
                    การเชื่อมต่อ LINE
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    LINE ใช้สำหรับรับแจ้งเตือนเท่านั้น ไม่ใช่ช่องทางเข้าสู่ระบบ
                  </p>
                </div>
              </div>
            </div>

            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold",
                lineStatus.connected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              {loading
                ? "กำลังโหลด"
                : lineStatus.connected
                  ? "เชื่อม LINE แล้ว"
                  : "ยังไม่ได้เชื่อม LINE"}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังโหลดสถานะ LINE...
            </div>
          ) : lineStatus.connected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-medium text-slate-500">ชื่อ LINE</div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {lineStatus.displayName || "-"}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-medium text-slate-500">วันที่เชื่อม</div>
                <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {formatDate(lineStatus.linkedAt)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <div className="text-xs font-medium text-slate-500">การแจ้งเตือน</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {lineStatus.notifyEnabled ? "เปิดรับแจ้งเตือน" : "ปิดรับแจ้งเตือน"}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              ยังไม่ได้เชื่อม LINE
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <span>{eligibilityMessage}</span>
          </div>

          {addFriendUrl && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-600">
                ผู้ใช้บางรายอาจต้องเพิ่ม LINE OA เป็นเพื่อนก่อนจึงจะรับข้อความแจ้งเตือนได้
              </p>
              <a
                href={addFriendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                เพิ่ม LINE OA เป็นเพื่อน
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {lineStatus.connected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting || loading}
                className="w-full sm:w-auto"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                ยกเลิกการเชื่อม LINE
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={connecting || loading}
                className="w-full sm:w-auto"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                เชื่อม LINE
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
