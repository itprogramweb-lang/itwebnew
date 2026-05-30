"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Pencil, Save, Trash2 } from "lucide-react";
import { AddButton, DashboardPageHeader, EmptyRow, FilterSelect, SearchFilter, TableShell, Td, Th } from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormInput } from "@/components/ui/Form";
import { getAuthToken } from "@/frontend/api/http";

type CourseRow = {
  id: string;
  course_id: string;
  course_name: string;
  sort_order: number;
  is_active: boolean;
  work_count: number;
};

type CourseForm = {
  course_id: string;
  course_name: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_FORM: CourseForm = {
  course_id: "",
  course_name: "",
  sort_order: "0",
  is_active: true,
};

const PROTECTED_COURSE_IDS = new Set([
  "09-142-203",
  "09-142-204",
  "09-142-205",
  "09-142-214",
  "09-142-302",
  "09-142-306",
  "09-142-313",
  "09-142-316",
  "09-142-321",
  "09-142-325",
  "09-142-361",
  "09-142-364",
  "09-142-365",
  "09-142-393",
  "09-142-394",
  "09-142-415",
  "09-142-417",
  "09-142-433",
  "09-142-460",
  "09-142-461",
  "09-143-301",
  "09-143-322",
  "09-143-420",
  "09-143-302",
  "09-143-439",
  "09-143-497",
  "09-143-209",
  "09-143-211",
  "09-143-362",
  "09-144-301",
  "09-144-402",
  "09-144-403",
  "09-144-304",
  "09-144-305",
  "09-144-406",
  "09-144-407",
  "09-144-408",
]);

async function requestCoursesApi<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "ดำเนินการไม่สำเร็จ");
  return json as T;
}

export default function CoursesDashboard() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const json = await requestCoursesApi<{ courses: CourseRow[]; setup_required?: boolean; message?: string }>("/api/admin/courses");
      setCourses(json.courses ?? []);
      setSetupRequired(json.setup_required === true);
      setSetupMessage(json.message ?? "");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "โหลดรายวิชาไม่สำเร็จ", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return courses.filter((course) => {
      const matchQ =
        !needle ||
        [course.course_id, course.course_name].join(" ").toLowerCase().includes(needle);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? course.is_active : !course.is_active);
      return matchQ && matchStatus;
    });
  }, [courses, q, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors([]);
    setModalOpen(true);
  };

  const openEdit = (course: CourseRow) => {
    setEditingId(course.id);
    setForm({
      course_id: course.course_id,
      course_name: course.course_name,
      sort_order: String(course.sort_order ?? 0),
      is_active: course.is_active,
    });
    setErrors([]);
    setModalOpen(true);
  };

  const validate = () => {
    const nextErrors: string[] = [];
    if (!form.course_id.trim()) nextErrors.push("กรุณากรอกรหัสวิชา");
    if (!form.course_name.trim()) nextErrors.push("กรุณากรอกชื่อวิชา");
    const order = Number(form.sort_order);
    if (!Number.isFinite(order) || order < 0) nextErrors.push("ลำดับต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
    return nextErrors;
  };

  const saveCourse = async () => {
    const nextErrors = validate();
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingId ?? undefined,
        course_id: form.course_id.trim(),
        course_name: form.course_name.trim(),
        sort_order: Number(form.sort_order),
        is_active: form.is_active,
      };
      const json = await requestCoursesApi<{ course: CourseRow }>("/api/admin/courses", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      setCourses((prev) =>
        editingId
          ? prev.map((course) => (course.id === editingId ? json.course : course))
          : [...prev, json.course].sort((a, b) => a.sort_order - b.sort_order)
      );
      showToast(editingId ? "บันทึกรายวิชาเรียบร้อยแล้ว" : "เพิ่มรายวิชาเรียบร้อยแล้ว");
      setModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "บันทึกรายวิชาไม่สำเร็จ", false);
    } finally {
      setSaving(false);
    }
  };

  const toggleCourseActive = async (course: CourseRow) => {
    const nextActive = !course.is_active;
    setSaving(true);
    try {
      const json = await requestCoursesApi<{ course: CourseRow }>("/api/admin/courses", {
        method: "PATCH",
        body: JSON.stringify({
          id: course.id,
          course_id: course.course_id,
          course_name: course.course_name,
          sort_order: course.sort_order,
          is_active: nextActive,
        }),
      });
      setCourses((prev) =>
        prev.map((item) => (item.id === course.id ? json.course : item))
      );
      showToast(nextActive ? "แสดงรายวิชาแล้ว" : "ซ่อนรายวิชาแล้ว");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "เปลี่ยนสถานะรายวิชาไม่สำเร็จ", false);
    } finally {
      setSaving(false);
    }
  };

  const isProtectedCourse = (course: CourseRow) => PROTECTED_COURSE_IDS.has(course.course_id);

  const getDeleteTitle = (course: CourseRow) => {
    if (isProtectedCourse(course)) return "รายวิชาเดิมไม่สามารถลบได้";
    if ((course.work_count ?? 0) > 0) return "มีผลงานรายวิชาใช้งานอยู่ ไม่สามารถลบได้";
    return "ลบรายวิชา";
  };

  const canDeleteCourse = (course: CourseRow) => !isProtectedCourse(course) && (course.work_count ?? 0) === 0;

  const deleteCourse = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const json = await requestCoursesApi<{ ok: boolean; message?: string }>(
        `/api/admin/courses?id=${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" }
      );
      setCourses((prev) => prev.filter((course) => course.id !== deleteTarget.id));
      showToast(json.message ?? "ลบรายวิชาเรียบร้อยแล้ว");
      setDeleteTarget(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ลบรายวิชาไม่สำเร็จ", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardPageHeader
        title="จัดการรายวิชา"
        description="จัดการ catalog รายวิชาที่ใช้ในหน้า Course Works"
        action={<AddButton label="เพิ่มรายวิชา" onClick={openAdd} disabled={setupRequired} />}
      />

      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
            toast.ok ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {setupRequired && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <div className="font-semibold">ยังไม่ได้สร้างตารางรายวิชาใน Supabase</div>
          <p className="mt-1">
            กรุณารันไฟล์ <span className="font-mono">supabase/round_student_courses_management.sql</span> ใน Supabase SQL Editor ก่อนใช้งานหน้านี้
          </p>
          {setupMessage && <p className="mt-1 text-amber-700">{setupMessage}</p>}
        </div>
      )}

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากรหัสวิชาหรือชื่อวิชา...">
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "ทั้งหมด" },
            { value: "active", label: "เปิดใช้งาน" },
            { value: "inactive", label: "ปิดใช้งาน" },
          ]}
        />
      </SearchFilter>

      <TableShell>
        <thead className="bg-slate-50/60">
          <tr>
            <Th>รหัสวิชา</Th>
            <Th>ชื่อวิชา</Th>
            <Th>ลำดับ</Th>
            <Th>สถานะ</Th>
            <Th>จำนวนผลงาน</Th>
            <Th className="text-right">จัดการ</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <EmptyRow colSpan={6} label="กำลังโหลด..." />
          ) : setupRequired ? (
            <EmptyRow colSpan={6} label="รอสร้างตารางรายวิชาใน Supabase" />
          ) : filtered.length === 0 ? (
            <EmptyRow colSpan={6} />
          ) : (
            filtered.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50/50">
                <Td className="font-medium text-slate-900">{course.course_id}</Td>
                <Td className="text-slate-700">{course.course_name}</Td>
                <Td className="text-slate-600">{course.sort_order}</Td>
                <Td>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                      course.is_active
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    {course.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </Td>
                <Td className="text-slate-600">{course.work_count ?? 0}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(course)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      title="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCourseActive(course)}
                      disabled={saving}
                      className={`rounded-lg p-2 transition disabled:cursor-not-allowed disabled:text-slate-200 ${
                        course.is_active
                          ? "text-emerald-600 hover:bg-amber-50 hover:text-amber-600"
                          : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                      }`}
                      title={course.is_active ? "ซ่อนรายวิชา" : "แสดงรายวิชา"}
                    >
                      {course.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => canDeleteCourse(course) && setDeleteTarget(course)}
                      disabled={saving || !canDeleteCourse(course)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-slate-200"
                      title={getDeleteTitle(course)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableShell>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "แก้ไขรายวิชา" : "เพิ่มรายวิชา"}
              </h2>
            </div>
            <div className="space-y-5 p-6">
              {errors.length > 0 && (
                <div className="space-y-1 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errors.map((error) => (
                    <div key={error}>• {error}</div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="รหัสวิชา"
                  required
                  value={form.course_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, course_id: event.target.value }))}
                  placeholder="09-142-306"
                />
                <FormInput
                  label="ลำดับ"
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                  placeholder="1"
                />
              </div>

              <FormInput
                label="ชื่อวิชา"
                required
                value={form.course_name}
                onChange={(event) => setForm((prev) => ({ ...prev, course_name: event.target.value }))}
                placeholder="การพัฒนาเว็บยุคใหม่"
              />

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <span>
                  <span className="block font-medium text-slate-800">เปิดใช้งาน</span>
                  <span className="block text-xs text-slate-500">ปิดใช้งานแล้วจะไม่แสดงในหน้า Course Works public</span>
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={saveCourse}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="ต้องการลบรายวิชานี้ถาวรหรือไม่?"
        description={deleteTarget ? `${deleteTarget.course_id} ${deleteTarget.course_name}` : ""}
        confirmLabel="ลบรายวิชา"
        variant="danger"
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteCourse}
      />
    </div>
  );
}
