"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Hash,
  Loader2,
  Lock,
  Mail,
  MessageSquareWarning,
  Phone,
  Save,
  User as UserIcon,
  X,
} from "lucide-react";
import type { ComplaintStatus } from "@/types";
import {
  complaintStatusLabels,
  complaintTypeLabels,
  getComplaintTypeLabel,
} from "@/data/complaints";
import {
  DashboardPageHeader,
  EmptyRow,
  FilterSelect,
  SearchFilter,
  TableShell,
  Td,
  Th,
} from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/badges";
import { formatDate, formatDateTime } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getComplaintAttachmentUrls } from "@/lib/complaintAttachments";
import Button from "@/components/ui/Button";
import { FormInput, FormSelect, FormTextarea } from "@/components/ui/Form";

type ComplaintRow = {
  id: string;
  tracking_code: string | null;
  complaint_type: string | null;
  title: string;
  detail: string;
  sender_name: string | null;
  student_id: string | null;
  email: string | null;
  phone: string | null;
  want_contact: boolean | null;
  attachment_url: string | null;
  attachment_urls?: string[] | null;
  status: string | null;
  assigned_to: string | null;
  internal_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ComplaintsResponse = {
  complaints?: ComplaintRow[];
  complaint?: ComplaintRow;
  permissions?: {
    canUpdate: boolean;
  };
  error?: string;
};

const statusOptions: { value: ComplaintStatus; label: string }[] = [
  { value: "new", label: complaintStatusLabels.new },
  { value: "in_progress", label: complaintStatusLabels.in_progress },
  { value: "resolved", label: complaintStatusLabels.resolved },
  { value: "rejected", label: complaintStatusLabels.rejected },
];

const typeOptions = Object.entries(complaintTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

function normalizeStatus(status: string | null): ComplaintStatus {
  if (status === "in_progress" || status === "resolved" || status === "rejected") return status;
  return "new";
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

export default function ComplaintsDashboard() {
  const [items, setItems] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canUpdate, setCanUpdate] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<ComplaintRow | null>(null);
  const [formStatus, setFormStatus] = useState<ComplaintStatus>("new");
  const [assignedTo, setAssignedTo] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/complaints", { headers });
      const data = (await res.json()) as ComplaintsResponse;
      if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดข้อร้องเรียนได้");
      setItems(data.complaints ?? []);
      setCanUpdate(data.permissions?.canUpdate === true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อร้องเรียนได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

const filtered = useMemo(() => {
  const query = q.trim().toLowerCase();

  return items.filter((item) => {
    const itemStatus = normalizeStatus(item.status);
    const itemType = item.complaint_type ?? "";

    const text = [
      item.tracking_code,
      item.title,
      item.detail,
      item.sender_name,
      item.email,
      item.phone,
      item.student_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchQ = !query || text.includes(query);
    const matchStatus = status === "all" || itemStatus === status;
    const matchType = type === "all" || itemType === type;

    return matchQ && matchStatus && matchType;
  });
}, [items, q, status, type]);

const counts = useMemo(
  () => ({
    total: items.length,
    new: items.filter((item) => normalizeStatus(item.status) === "new").length,
    in_progress: items.filter((item) => normalizeStatus(item.status) === "in_progress").length,
    resolved: items.filter((item) => normalizeStatus(item.status) === "resolved").length,
    rejected: items.filter((item) => normalizeStatus(item.status) === "rejected").length,
  }),
  [items]
);

const selectedAttachmentUrls = useMemo(
  () => (selected ? getComplaintAttachmentUrls(selected) : []),
  [selected]
);

  const openDetail = (item: ComplaintRow) => {
    setSelected(item);
    setFormStatus(normalizeStatus(item.status));
    setAssignedTo(item.assigned_to ?? "");
    setInternalNote(item.internal_note ?? "");
    setNotice(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!selected || !canUpdate) return;
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: selected.id,
          status: formStatus,
          assigned_to: assignedTo,
          internal_note: internalNote,
        }),
      });
      const data = (await res.json()) as ComplaintsResponse;
      if (!res.ok || !data.complaint) {
        throw new Error(data.error || "ไม่สามารถบันทึกข้อร้องเรียนได้");
      }

      setItems((prev) => prev.map((item) => (item.id === data.complaint!.id ? data.complaint! : item)));
      setSelected(data.complaint);
      setNotice("อัปเดตข้อร้องเรียนเรียบร้อยแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อร้องเรียนได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardPageHeader
        title="ข้อร้องเรียน / ความคิดเห็น"
        description={`ทั้งหมด ${items.length} เรื่อง • ใหม่ ${counts.new} • กำลังดำเนินการ ${counts.in_progress} • ดำเนินการแล้ว ${counts.resolved}`}
      />

      {notice && <StatusBox type="success" message={notice} />}
      {error && <StatusBox type="error" message={error} />}

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
  {[
    { label: "ข้อร้องเรียนทั้งหมด", value: counts.total },
    { label: "ใหม่", value: counts.new },
    { label: "กำลังดำเนินการ", value: counts.in_progress },
    { label: "ดำเนินการแล้ว", value: counts.resolved },
    { label: "ไม่ดำเนินการ", value: counts.rejected },
  ].map((stat) => (
    <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{stat.label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</div>
    </div>
  ))}
</div>


      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากเลขที่/หัวข้อ/รายละเอียด/อีเมล...">
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "ทุกสถานะ" }, ...statusOptions]}
        />
        <FilterSelect
          value={type}
          onChange={setType}
          options={[{ value: "all", label: "ทุกประเภท" }, ...typeOptions]}
        />
      </SearchFilter>

      <TableShell>
        <thead className="bg-slate-50/60">
          <tr>
            <Th>เลขที่</Th>
            <Th>ประเภท</Th>
            <Th>หัวข้อ</Th>
            <Th>ผู้ส่ง</Th>
            <Th>วันที่</Th>
            <Th>สถานะ</Th>
            <Th>ผู้รับผิดชอบ</Th>
            <Th className="text-right">จัดการ</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
        {loading ? (
  <EmptyRow colSpan={8} label="กำลังโหลดข้อร้องเรียน..." />
) : filtered.length === 0 ? (
  <EmptyRow colSpan={8} />
) : (
           filtered.map((item) => {
  return (
<tr key={item.id} className="hover:bg-slate-50/50">
  <Td className="font-mono text-xs text-brand-600 whitespace-nowrap">
    {item.tracking_code || item.id.slice(0, 8)}
  </Td>
  <Td className="whitespace-nowrap text-xs text-slate-600">
  {getComplaintTypeLabel(item.complaint_type)}
  </Td>
  <Td>
    <div className="font-medium text-slate-900 line-clamp-1 max-w-xs">{item.title}</div>
    <div className="text-xs text-slate-500 line-clamp-1 max-w-xs">{item.detail}</div>
  </Td>
  <Td className="text-xs text-slate-600">
    {item.sender_name || item.email || <span className="text-slate-400 italic">ไม่ระบุ</span>}
  </Td>
  <Td className="text-xs text-slate-500 whitespace-nowrap">
    {item.created_at ? formatDate(item.created_at) : "-"}
  </Td>
  <Td>
    <StatusBadge status={normalizeStatus(item.status)} />
  </Td>
  <Td className="text-xs text-slate-600">
    {item.assigned_to || <span className="text-slate-400">-</span>}
  </Td>
  <Td className="text-right">
    <button
      onClick={() => openDetail(item)}
      className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition"
    >
      ดูรายละเอียด
    </button>
  </Td>
</tr>
              );
            })
          )}
        </tbody>
      </TableShell>

      {selected && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed inset-y-0 right-0 w-full max-w-xl bg-white z-50 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient grid place-items-center text-white">
                  <MessageSquareWarning className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-mono">
                    {selected.tracking_code || selected.id}
                  </div>
                  <div className="font-semibold text-slate-900">รายละเอียดเรื่อง</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 -mr-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs bg-brand-50 text-brand-700 border border-brand-100">
                   {getComplaintTypeLabel(selected.complaint_type)}
                  </span>
                  <StatusBadge status={normalizeStatus(selected.status)} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 leading-snug">{selected.title}</h2>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed whitespace-pre-wrap">
                  {selected.detail}
                </p>
                {selectedAttachmentUrls.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-medium text-slate-500">
                      รูปภาพแนบ {selectedAttachmentUrls.length} รูป
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAttachmentUrls.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-brand-200"
                        >
                          <img
                            src={url}
                            alt={`รูปภาพแนบ ${index + 1}`}
                            className="h-28 w-full object-cover"
                          />
                          <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-brand-600 group-hover:text-brand-700">
                            <span>เปิดรูปที่ {index + 1}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  ข้อมูลผู้ส่ง
                </div>
                <InfoRow icon={<UserIcon className="w-4 h-4" />} label="ชื่อ" value={selected.sender_name || "ไม่ระบุ"} />
                <InfoRow icon={<Hash className="w-4 h-4" />} label="รหัสนักศึกษา" value={selected.student_id || "-"} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="อีเมล" value={selected.email || "-"} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="เบอร์" value={selected.phone || "-"} />
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="วันที่ส่ง"
                  value={selected.created_at ? formatDateTime(selected.created_at) : "-"}
                />
                <div className="text-xs text-slate-500 pt-1">
                  ต้องการให้ติดต่อกลับ:{" "}
                  <span className="font-medium text-slate-900">
                    {selected.want_contact ? "ใช่" : "ไม่ต้องการ"}
                  </span>
                </div>
              </div>

              <fieldset disabled={!canUpdate} className="space-y-4 disabled:opacity-70">
                <FormSelect
                  label="สถานะ"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ComplaintStatus)}
                  options={statusOptions}
                />
                <FormInput
                  label="ผู้รับผิดชอบ"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                />
                <FormTextarea
                  label="บันทึกภายใน"
                  rows={4}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                />
              </fieldset>
              <div className="space-y-4">
                {!canUpdate && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    บัญชีนี้มีสิทธิ์ดูข้อร้องเรียน แต่ไม่มีสิทธิ์อัปเดตสถานะหรือบันทึกภายใน
                  </div>
                )}
              </div>

              <Button onClick={handleSave} fullWidth size="lg" disabled={!canUpdate || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function StatusBox({ type, message }: { type: "success" | "error"; message: string }) {
  const ok = type === "success";
  return (
    <div
      className={`mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-slate-400">{icon}</div>
      <div className="text-xs text-slate-500 w-24 shrink-0">{label}</div>
      <div className="text-slate-900 font-medium break-all">{value}</div>
    </div>
  );
}
