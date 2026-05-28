"use client";
import { useEffect, useMemo, useState } from "react";
import { Edit3, PowerOff } from "lucide-react";
import type { UserRole } from "@/types";
import {
  DashboardPageHeader,
  SearchFilter,
  FilterSelect,
  AddButton,
  TableShell,
  Th,
  Td,
  EmptyRow,
} from "@/components/ui/DataTable";
import { RoleBadge } from "@/components/ui/badges";
import { cn, formatDate } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { roleOptions } from "@/data/users";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Button from "@/components/ui/Button";
import { FormInput, FormSelect, FormCheckbox } from "@/components/ui/Form";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type UserForm = {
  email: string;
  temporaryPassword: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

const initialForm: UserForm = {
  email: "",
  temporaryPassword: "",
  full_name: "",
  role: "website_admin",
  is_active: true,
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

function UserModal({
  mode,
  open,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  open: boolean;
  form: UserForm;
  saving: boolean;
  error: string | null;
  onChange: (patch: Partial<UserForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === "create" ? "เพิ่มผู้ใช้งาน" : "แก้ไขผู้ใช้งาน"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "create"
              ? "สร้างบัญชี Supabase Auth และกำหนด role เริ่มต้น"
              : "แก้ไขชื่อ role และสถานะการใช้งาน"}
          </p>
        </div>

        <div className="space-y-4">
          {mode === "create" && (
            <>
              <FormInput
                label="อีเมล"
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
              />
              <FormInput
                label="Temporary password"
                type="password"
                required
                hint="อย่างน้อย 8 ตัวอักษร"
                value={form.temporaryPassword}
                onChange={(e) => onChange({ temporaryPassword: e.target.value })}
              />
            </>
          )}
          <FormInput
            label="ชื่อ-นามสกุล"
            value={form.full_name}
            onChange={(e) => onChange({ full_name: e.target.value })}
          />
          <FormSelect
            label="Role"
            required
            value={form.role}
            onChange={(e) => onChange({ role: e.target.value as UserRole })}
            options={roleOptions}
          />
          <div className="rounded-2xl bg-slate-50 p-4">
            <FormCheckbox
              label="เปิดใช้งานบัญชีนี้"
              checked={form.is_active}
              onChange={(e) => onChange({ is_active: e.target.checked })}
            />
          </div>
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UsersDashboard() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถโหลดผู้ใช้งานได้");
      setItems(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดผู้ใช้งานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((u) => {
        const query = q.trim().toLowerCase();
        const matchQ =
          !query ||
          u.full_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query);
        const matchR = role === "all" || u.role === role;
        const matchS =
          status === "all" ||
          (status === "active" && u.is_active) ||
          (status === "inactive" && !u.is_active);
        return matchQ && matchR && matchS;
      }),
    [items, q, role, status]
  );

  const openCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setError(null);
    setModalMode("create");
  };

  const openEdit = (user: AdminUser) => {
    setForm({
      email: user.email,
      temporaryPassword: "",
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    });
    setEditingId(user.id);
    setError(null);
    setModalMode("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setEditingId(null);
    setForm(initialForm);
  };

  const saveUser = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const headers = await getAuthHeaders();
      const isCreate = modalMode === "create";
      const res = await fetch(isCreate ? "/api/admin/users" : `/api/admin/users/${editingId}`, {
        method: isCreate ? "POST" : "PATCH",
        headers,
        body: JSON.stringify(
          isCreate
            ? form
            : {
                full_name: form.full_name,
                role: form.role,
                is_active: form.is_active,
              }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถบันทึกผู้ใช้งานได้");
      setNotice(isCreate ? "สร้างผู้ใช้งานเรียบร้อยแล้ว" : "อัปเดตผู้ใช้งานเรียบร้อยแล้ว");
      setModalMode(null);
      setEditingId(null);
      setForm(initialForm);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกผู้ใช้งานได้");
    } finally {
      setSaving(false);
    }
  };

  const deactivateUser = async () => {
    if (!confirmId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${confirmId}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถปิดใช้งานผู้ใช้ได้");
      setNotice("ปิดใช้งานผู้ใช้เรียบร้อยแล้ว");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถปิดใช้งานผู้ใช้ได้");
    } finally {
      setSaving(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardPageHeader
        title="ผู้ใช้งานในระบบ"
        description={`ทั้งหมด ${items.length} บัญชี • เฉพาะ Super Admin เท่านั้น`}
        action={<AddButton label="เพิ่มผู้ใช้" onClick={openCreate} />}
      />

      {notice && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && !modalMode && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากชื่อหรืออีเมล...">
        <FilterSelect
          value={role}
          onChange={setRole}
          options={[{ value: "all", label: "ทุก Role" }, ...roleOptions]}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "ทุกสถานะ" },
            { value: "active", label: "ใช้งาน" },
            { value: "inactive", label: "ปิดใช้งาน" },
          ]}
        />
      </SearchFilter>

      <TableShell>
        <thead className="bg-slate-50/60">
          <tr>
            <Th>ชื่อ</Th>
            <Th>อีเมล</Th>
            <Th>Role</Th>
            <Th>สถานะ</Th>
            <Th>วันที่สร้าง</Th>
            <Th className="text-right">จัดการ</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow colSpan={6} label="กำลังโหลดผู้ใช้งาน..." />
          ) : filtered.length === 0 ? (
            <EmptyRow colSpan={6} />
          ) : (
            filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-xs font-semibold text-white">
                      {(u.full_name || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium text-slate-900">
                      {u.full_name || "-"}
                    </div>
                  </div>
                </Td>
                <Td className="text-xs text-slate-600">{u.email}</Td>
                <Td>
                  <RoleBadge role={u.role} />
                </Td>
                <Td>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      u.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        u.is_active ? "bg-emerald-500" : "bg-slate-400"
                      )}
                    />
                    {u.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-xs text-slate-500">
                  {u.created_at ? formatDate(u.created_at) : "-"}
                </Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                      title="แก้ไข"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmId(u.id)}
                      disabled={!u.is_active}
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                      title="ปิดใช้งาน"
                    >
                      <PowerOff className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      <UserModal
        mode={modalMode ?? "create"}
        open={!!modalMode}
        form={form}
        saving={saving}
        error={modalMode ? error : null}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClose={closeModal}
        onSubmit={saveUser}
      />

      <ConfirmModal
        open={!!confirmId}
        title="ปิดใช้งานผู้ใช้?"
        description="บัญชีนี้จะไม่สามารถเข้าระบบได้ แต่ข้อมูล profile จะยังอยู่ในระบบ"
        variant="danger"
        confirmLabel="ปิดใช้งาน"
        onClose={() => setConfirmId(null)}
        onConfirm={deactivateUser}
      />
    </div>
  );
}
