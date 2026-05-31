"use client";
import { useEffect, useMemo, useState } from "react";
import { Edit3, KeyRound, PowerOff, RotateCcw, Trash2, X } from "lucide-react";
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
import {
  getUserPermissions,
  updateUserPermissions,
  UsersApiError,
  type UserPermissionOverride,
  type UserPermissionsResponse,
} from "@/frontend/api/users";

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

type ConfirmAction =
  | { type: "deactivate"; user: AdminUser }
  | { type: "reactivate"; user: AdminUser }
  | { type: "delete"; user: AdminUser };

type PermissionSelection = "role" | "allow" | "deny";

type PermissionGroup = {
  title: string;
  permissions: string[];
};

const permissionGroups: PermissionGroup[] = [
  {
    title: "ภาพรวมแดชบอร์ด",
    permissions: ["view_dashboard", "view_own_profile"],
  },
  {
    title: "ผู้ใช้งาน / สิทธิ์",
    permissions: ["manage_users", "manage_permissions"],
  },
  {
    title: "หน้าเว็บ / เมนู / ตั้งค่า",
    permissions: ["manage_pages", "manage_settings"],
  },
  {
    title: "ข่าว / Hero",
    permissions: ["manage_news", "manage_hero_slides"],
  },
  {
    title: "บุคลากร / หลักสูตร / รายวิชา",
    permissions: [
      "manage_staff",
      "manage_programs",
      "manage_registration",
      "manage_loan",
      "manage_welfare",
    ],
  },
  {
    title: "ผลงาน",
    permissions: [
      "manage_works",
      "manage_student_works",
      "manage_teacher_works",
      "edit_own_teacher_works",
      "edit_advised_student_works",
    ],
  },
  {
    title: "ข้อร้องเรียน",
    permissions: [
      "manage_complaints",
      "view_complaints",
      "view_all_complaints",
      "view_own_complaints",
      "change_complaint_status_all",
      "change_complaint_status_partial",
    ],
  },
];

const dangerousPermissions = new Set([
  "manage_users",
  "manage_permissions",
  "manage_settings",
  "manage_pages",
]);

function buildPermissionGroups(allPermissions: string[]) {
  const known = new Set(permissionGroups.flatMap((group) => group.permissions));
  const groups = permissionGroups
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter((permission) =>
        allPermissions.includes(permission)
      ),
    }))
    .filter((group) => group.permissions.length > 0);
  const otherPermissions = allPermissions.filter((permission) => !known.has(permission));

  if (otherPermissions.length > 0) {
    groups.push({ title: "อื่น ๆ", permissions: otherPermissions });
  }

  return groups;
}

function selectionsFromOverrides(overrides: UserPermissionOverride[]) {
  return overrides.reduce<Record<string, PermissionSelection>>((acc, override) => {
    acc[override.permission] = override.effect;
    return acc;
  }, {});
}

function overridesFromSelections(selections: Record<string, PermissionSelection>) {
  return Object.entries(selections)
    .filter(([, effect]) => effect === "allow" || effect === "deny")
    .map(([permission, effect]) => ({
      permission,
      effect: effect as "allow" | "deny",
    }));
}

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

function PermissionBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "role" | "allow" | "deny" | "effective" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        variant === "role" && "border-sky-200 bg-sky-50 text-sky-700",
        variant === "allow" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "deny" && "border-rose-200 bg-rose-50 text-rose-700",
        variant === "effective" && "border-brand-200 bg-brand-50 text-brand-700",
        variant === "muted" && "border-slate-200 bg-slate-50 text-slate-500"
      )}
    >
      {children}
    </span>
  );
}

function PermissionModal({
  target,
  data,
  selections,
  loading,
  saving,
  error,
  notice,
  onClose,
  onChange,
  onSave,
}: {
  target: AdminUser | null;
  data: UserPermissionsResponse | null;
  selections: Record<string, PermissionSelection>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  onClose: () => void;
  onChange: (permission: string, selection: PermissionSelection) => void;
  onSave: () => void;
}) {
  if (!target) return null;

  const allPermissions = data?.all_permissions ?? [];
  const basePermissions = new Set(data?.base_permissions ?? []);
  const effectivePermissions = new Set(data?.effective_permissions ?? []);
  const groupedPermissions = buildPermissionGroups(allPermissions);
  const hasDangerousAllow = Object.entries(selections).some(
    ([permission, selection]) =>
      selection === "allow" && dangerousPermissions.has(permission)
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">จัดการสิทธิ์</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">
                {target.full_name || target.email}
              </span>
              <span>{target.email}</span>
              <RoleBadge role={target.role} />
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  target.is_active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                )}
              >
                {target.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="ปิด"
            title="ปิด"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              กำลังโหลดสิทธิ์...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
                หมายเหตุ: การตั้งค่านี้จะมีผลเต็มรูปแบบหลังจากเชื่อมระบบตรวจสิทธิ์ในรอบถัดไป
              </div>

              {data?.warning && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  ยังไม่ได้ติดตั้งตาราง custom permissions ระบบจะแสดงสิทธิ์ตาม role เดิม
                </div>
              )}

              {hasDangerousAllow && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  กำลังให้สิทธิ์ระดับสูง โปรดตรวจสอบก่อนบันทึก
                </div>
              )}

              {notice && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {notice}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {groupedPermissions.map((group) => (
                <section key={group.title} className="rounded-2xl border border-slate-100">
                  <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {group.permissions.map((permission) => {
                      const selection = selections[permission] ?? "role";
                      const fromRole = basePermissions.has(permission);
                      const finalAllowed = effectivePermissions.has(permission);

                      return (
                        <div
                          key={permission}
                          className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <div className="min-w-0">
                            <div className="break-words font-mono text-sm text-slate-900">
                              {permission}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {fromRole ? (
                                <PermissionBadge variant="role">มาจาก role</PermissionBadge>
                              ) : (
                                <PermissionBadge variant="muted">ไม่ได้มาจาก role</PermissionBadge>
                              )}
                              {selection === "allow" && (
                                <PermissionBadge variant="allow">เพิ่มสิทธิ์</PermissionBadge>
                              )}
                              {selection === "deny" && (
                                <PermissionBadge variant="deny">ปิดสิทธิ์</PermissionBadge>
                              )}
                              {finalAllowed ? (
                                <PermissionBadge variant="effective">มีผลใช้งาน</PermissionBadge>
                              ) : (
                                <PermissionBadge variant="muted">ไม่มีผลใช้งาน</PermissionBadge>
                              )}
                            </div>
                          </div>
                          <select
                            value={selection}
                            onChange={(event) =>
                              onChange(permission, event.target.value as PermissionSelection)
                            }
                            disabled={saving}
                            className="h-10 min-w-40 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            <option value="role">ตาม role</option>
                            <option value="allow">อนุญาตเพิ่ม</option>
                            <option value="deny">ปิดสิทธิ์</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            ปิด
          </Button>
          <Button onClick={onSave} disabled={saving || loading || !data}>
            {saving ? "กำลังบันทึก..." : "บันทึกสิทธิ์"}
          </Button>
        </div>
      </div>
    </div>
  );
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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<AdminUser | null>(null);
  const [permissionData, setPermissionData] = useState<UserPermissionsResponse | null>(null);
  const [permissionSelections, setPermissionSelections] = useState<
    Record<string, PermissionSelection>
  >({});
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUserId() {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (mounted) setCurrentUserId(data.session?.user.id ?? null);
    }

    loadCurrentUserId();
    return () => {
      mounted = false;
    };
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

  const currentUser = useMemo(
    () => items.find((item) => item.id === currentUserId) ?? null,
    [items, currentUserId]
  );
  const canManageCustomPermissions = currentUser?.role === "super_admin";

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

  const loadPermissionData = async (user: AdminUser) => {
    setPermissionLoading(true);
    setPermissionError(null);
    setPermissionNotice(null);
    try {
      const data = await getUserPermissions(user.id);
      setPermissionData(data);
      setPermissionSelections(selectionsFromOverrides(data.overrides ?? []));
    } catch (err) {
      if (err instanceof UsersApiError && err.status === 403) {
        setPermissionError("ไม่มีสิทธิ์จัดการ custom permissions");
      } else {
        setPermissionError(
          err instanceof Error ? err.message : "ไม่สามารถโหลด custom permissions ได้"
        );
      }
      setPermissionData(null);
      setPermissionSelections({});
    } finally {
      setPermissionLoading(false);
    }
  };

  const openPermissionModal = async (user: AdminUser) => {
    setPermissionTarget(user);
    setPermissionData(null);
    setPermissionSelections({});
    await loadPermissionData(user);
  };

  const closePermissionModal = () => {
    if (permissionSaving) return;
    setPermissionTarget(null);
    setPermissionData(null);
    setPermissionSelections({});
    setPermissionError(null);
    setPermissionNotice(null);
  };

  const savePermissions = async () => {
    if (!permissionTarget) return;
    setPermissionSaving(true);
    setPermissionError(null);
    setPermissionNotice(null);
    try {
      const overrides = overridesFromSelections(permissionSelections);
      const data = await updateUserPermissions(permissionTarget.id, overrides);
      setPermissionData(data);
      setPermissionSelections(selectionsFromOverrides(data.overrides ?? []));
      setPermissionNotice(data.audit_warning || "บันทึกสิทธิ์เรียบร้อยแล้ว");
    } catch (err) {
      if (err instanceof UsersApiError && err.status === 409) {
        setPermissionError(
          "ยังไม่ได้ติดตั้งตาราง custom permissions กรุณารัน migration ก่อนใช้งานการบันทึกสิทธิ์"
        );
      } else if (err instanceof UsersApiError && err.status === 403) {
        setPermissionError("ไม่มีสิทธิ์จัดการ custom permissions");
      } else {
        setPermissionError(
          err instanceof Error ? err.message : "ไม่สามารถบันทึก custom permissions ได้"
        );
      }
    } finally {
      setPermissionSaving(false);
    }
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

  const toggleUserActive = async () => {
    if (!confirmAction || confirmAction.type === "delete") return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const headers = await getAuthHeaders();
      const nextActive = confirmAction.type === "reactivate";
      const res = await fetch(`/api/admin/users/${confirmAction.user.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_active: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (nextActive ? "ไม่สามารถเปิดใช้งานผู้ใช้ได้" : "ไม่สามารถปิดใช้งานผู้ใช้ได้")
        );
      }
      setNotice(nextActive ? "เปิดใช้งานผู้ใช้เรียบร้อยแล้ว" : "ปิดใช้งานผู้ใช้เรียบร้อยแล้ว");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถอัปเดตสถานะผู้ใช้ได้");
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const deleteUserPermanently = async () => {
    if (!confirmAction || confirmAction.type !== "delete") return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/${confirmAction.user.id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถลบผู้ใช้ถาวรได้");
      setNotice("ลบผู้ใช้ถาวรเรียบร้อยแล้ว");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถลบผู้ใช้ถาวรได้");
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const confirmModalCopy = (() => {
    if (!confirmAction) return null;
    if (confirmAction.type === "delete") {
      return {
        title: "ต้องการลบผู้ใช้นี้ถาวรหรือไม่?",
        description:
          "บัญชีนี้จะถูกลบจาก Supabase Auth และไม่สามารถเข้าสู่ระบบได้อีก การกระทำนี้ไม่ควรใช้แทนการปิดใช้งานบัญชี",
        confirmLabel: "ลบถาวร",
        onConfirm: deleteUserPermanently,
      };
    }
    if (confirmAction.type === "reactivate") {
      return {
        title: "ต้องการเปิดใช้งานผู้ใช้นี้หรือไม่?",
        description: "ผู้ใช้นี้จะสามารถกลับมาใช้งานหลังบ้านได้ตาม role ที่กำหนดไว้",
        confirmLabel: "เปิดใช้งาน",
        onConfirm: toggleUserActive,
      };
    }
    return {
      title: "ต้องการปิดใช้งานผู้ใช้นี้หรือไม่?",
      description: "ผู้ใช้นี้จะไม่สามารถใช้งานหลังบ้านได้ แต่ข้อมูลบัญชียังถูกเก็บไว้",
      confirmLabel: "ปิดใช้งาน",
      onConfirm: toggleUserActive,
    };
  })();

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
                  <div className="inline-flex flex-wrap justify-end gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                      title="แก้ไข"
                      aria-label="แก้ไข"
                    >
                      <Edit3 className="h-4 w-4" />
                      แก้ไข
                    </button>
                    {canManageCustomPermissions && (
                      <button
                        onClick={() => openPermissionModal(u)}
                        disabled={u.role === "super_admin"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs",
                          u.role === "super_admin"
                            ? "cursor-not-allowed text-slate-300"
                            : "text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                        )}
                        title={
                          u.role === "super_admin"
                            ? "ไม่สามารถปรับสิทธิ์ custom ของ Super Admin ได้"
                            : "สิทธิ์"
                        }
                        aria-label="สิทธิ์"
                      >
                        <KeyRound className="h-4 w-4" />
                        สิทธิ์
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setConfirmAction({
                          type: u.is_active ? "deactivate" : "reactivate",
                          user: u,
                        })
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs",
                        u.is_active
                          ? "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                          : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      )}
                      title={u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      aria-label={u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    >
                      {u.is_active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: "delete", user: u })}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      title="ลบถาวร"
                      aria-label="ลบถาวร"
                    >
                      <Trash2 className="h-4 w-4" />
                      ลบถาวร
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

      <PermissionModal
        target={permissionTarget}
        data={permissionData}
        selections={permissionSelections}
        loading={permissionLoading}
        saving={permissionSaving}
        error={permissionError}
        notice={permissionNotice}
        onClose={closePermissionModal}
        onChange={(permission, selection) =>
          setPermissionSelections((prev) => ({
            ...prev,
            [permission]: selection,
          }))
        }
        onSave={savePermissions}
      />

      <ConfirmModal
        open={!!confirmModalCopy}
        title={confirmModalCopy?.title ?? ""}
        description={confirmModalCopy?.description ?? ""}
        variant="danger"
        confirmLabel={confirmModalCopy?.confirmLabel ?? "ยืนยัน"}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmModalCopy?.onConfirm()}
      />
    </div>
  );
}
