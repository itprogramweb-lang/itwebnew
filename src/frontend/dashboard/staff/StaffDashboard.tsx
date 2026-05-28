"use client";
import { useState, useEffect, useMemo } from "react";
import { Pencil, Trash2, CheckCircle2, X, AlertCircle, EyeOff, Eye } from "lucide-react";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import { staffApi } from "@/frontend/api/staff";
import type { StaffMemberRow } from "@/lib/supabase/queries";
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
import { FormInput, FormTextarea, FormSelect, FormCheckbox, Label } from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CroppedImage from "@/components/ui/CroppedImage";
import { cropToJson, getDefaultImageCrop, type ImageCropSettings } from "@/lib/imageCrop";

const FALLBACK = "/placeholders/staff-placeholder.svg";

const ROLE_OPTIONS = [
  { value: "executive", label: "หัวหน้าสาขา" },
  { value: "teacher", label: "อาจารย์ประจำ" },
  { value: "officer", label: "เจ้าหน้าที่ธุรการประจำสาขาวิชา" },
  { value: "lab_officer", label: "เจ้าหน้าที่ประจำห้องปฏิบัติการ" },
];

const ROLE_LABELS: Record<string, string> = {
  executive: "หัวหน้าสาขา",
  teacher: "อาจารย์ประจำ",
  officer: "เจ้าหน้าที่ธุรการฯ",
  lab_officer: "เจ้าหน้าที่ห้องแล็บ",
};

// ─── Form type ────────────────────────────────────────────────────────────────
type FormData = {
  full_name: string;
  position: string;
  role_type: string;
  education: string;
  expertise_raw: string;
  email: string;
  phone: string;
  office: string;
  image_url: string;
  image_alt: string;
  image_crop_settings: ImageCropSettings;
  bio: string;
  sort_order: string;
  is_active: boolean;
};

const DEFAULT: FormData = {
  full_name: "",
  position: "",
  role_type: "teacher",
  education: "",
  expertise_raw: "",
  email: "",
  phone: "",
  office: "",
  image_url: "",
  image_alt: "",
  image_crop_settings: getDefaultImageCrop({ frameShape: "circle", aspectPreset: "1:1" }),
  bio: "",
  sort_order: "",
  is_active: true,
};

const toForm = (s: StaffMemberRow): FormData => ({
  full_name: s.full_name,
  position: s.position ?? "",
  role_type: s.role_type ?? "teacher",
  education: s.education ?? "",
  expertise_raw: (s.expertise ?? []).join(", "),
  email: s.email ?? "",
  phone: s.phone ?? "",
  office: s.office ?? "",
  image_url: s.image_url ?? "",
  image_alt: s.image_alt ?? "",
  image_crop_settings: cropToJson(s.image_crop_settings),
  bio: s.bio ?? "",
  sort_order: s.sort_order !== null ? String(s.sort_order) : "",
  is_active: s.is_active ?? true,
});

const splitMultiValue = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const toPayload = (f: FormData) => ({
  full_name: f.full_name.trim(),
  position: f.position.trim() || null,
  role_type: f.role_type || null,
  education: f.education.trim() || null,
  expertise: f.expertise_raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
  email: splitMultiValue(f.email).join(", ") || null,
  phone: splitMultiValue(f.phone).join(", ") || null,
  office: f.office.trim() || null,
  image_url: f.image_url.trim() || null,
  image_alt: f.image_alt.trim() || null,
  image_crop_settings: cropToJson(f.image_crop_settings),
  bio: f.bio.trim() || null,
  sort_order: f.sort_order !== "" ? Number(f.sort_order) : null,
  is_active: f.is_active,
});

const validate = (f: FormData): string[] => {
  const errs: string[] = [];

  if (!f.full_name.trim()) {
    errs.push("กรุณากรอกชื่อ-นามสกุล");
  }

  const emails = splitMultiValue(f.email);
  const invalidEmails = emails.filter(
    (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );

  if (invalidEmails.length > 0) {
    errs.push("รูปแบบอีเมลไม่ถูกต้อง: " + invalidEmails.join(", "));
  }

  if (f.sort_order !== "" && isNaN(Number(f.sort_order))) {
    errs.push("ลำดับต้องเป็นตัวเลข");
  }

  return errs;
};
// ─── Main component ───────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const [items, setItems] = useState<StaffMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await staffApi.list();
      setItems(data);
    } catch (err) {
      showToast("โหลดข้อมูลไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)), false);
    }
    setLoading(false);
  };

  useEffect(() => { loadStaff(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(
    () =>
      items
        .filter((s) => {
          const matchQ =
            !q ||
            s.full_name.toLowerCase().includes(q.toLowerCase()) ||
            (s.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
            (s.position ?? "").toLowerCase().includes(q.toLowerCase());

          const matchR = roleFilter === "all" || s.role_type === roleFilter;

          const matchS =
            statusFilter === "all" ||
            (statusFilter === "active" && s.is_active !== false) ||
            (statusFilter === "inactive" && s.is_active === false);

          return matchQ && matchR && matchS;
        })
        .sort((a, b) => {
          const aS = a.sort_order ?? 999;
          const bS = b.sort_order ?? 999;

          if (aS !== bS) return aS - bS;

          return a.full_name.localeCompare(b.full_name, "th");
        }),
    [items, q, roleFilter, statusFilter]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(DEFAULT);
    setFormErrors([]);
    setModalOpen(true);
  };

  const openEdit = (s: StaffMemberRow) => {
    setEditingId(s.id);
    setForm(toForm(s));
    setFormErrors([]);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    const selectedOrder = form.sort_order !== "" ? Number(form.sort_order) : null;

    if (
      selectedOrder !== null &&
      items.some((item) => item.id !== editingId && item.sort_order === selectedOrder)
    ) {
      errs.push(`ลำดับ ${selectedOrder} มีคนเลือกแล้ว กรุณาเลือกลำดับอื่น`);
    }
    if (errs.length) { setFormErrors(errs); return; }
    setSaving(true);
    setFormErrors([]);
    const payload = toPayload(form);

    try {
      if (editingId) {
        const updated = await staffApi.update(editingId, payload);
        setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
        setModalOpen(false);
        showToast("แก้ไขข้อมูลเรียบร้อยแล้ว");
      } else {
        const created = await staffApi.create(payload);
        setItems((prev) => [...prev, created]);
        setModalOpen(false);
        showToast("เพิ่มบุคลากรเรียบร้อยแล้ว");
      }
    } catch (err) {
      showToast(
        (editingId ? "บันทึกไม่สำเร็จ: " : "เพิ่มข้อมูลไม่สำเร็จ: ") +
        (err instanceof Error ? err.message : String(err)),
        false
      );
    }
    setSaving(false);
  };

  const handleSoftDelete = async () => {
    if (!confirmId) return;

    try {
      await staffApi.hide(confirmId);

      setItems((prev) =>
        prev.map((x) =>
          x.id === confirmId ? { ...x, is_active: false } : x
        )
      );

      showToast("ซ่อนบุคลากรแล้ว");
    } catch (err) {
      showToast(
        "เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : String(err)),
        false
      );
    }

    setConfirmId(null);
  };

  const handleToggleActive = async (s: StaffMemberRow) => {
    const nextActive = s.is_active === false;

    try {
      const updated = await staffApi.update(s.id, {
        is_active: nextActive,
      });

      setItems((prev) =>
        prev.map((x) => (x.id === s.id ? updated : x))
      );

      showToast(nextActive ? "เปิดแสดงบุคลากรแล้ว" : "ซ่อนบุคลากรแล้ว");
    } catch (err) {
      showToast(
        "เปลี่ยนสถานะไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)),
        false
      );
    }
  };

const maxOrder = editingId ? items.length : items.length + 1;

const usedSortOrders = new Map<number, string>();

items
  .filter((item) => item.id !== editingId)
  .forEach((item) => {
    if (typeof item.sort_order === "number") {
      usedSortOrders.set(item.sort_order, item.full_name);
    }
  });

const sortOrderOptions = [
  { value: "", label: "ยังไม่กำหนดลำดับ" },
  ...Array.from({ length: maxOrder }, (_, i) => {
    const order = i + 1;
    const usedBy = usedSortOrders.get(order);

    return {
      value: String(order),
      label: usedBy ? `ลำดับ ${order} — ${usedBy} เลือกแล้ว` : `ลำดับ ${order}`,
      disabled: Boolean(usedBy),
    };
  }),
];


  const handleHardDelete = async () => {
    if (!deleteId) return;

    try {
      await staffApi.deletePermanent(deleteId);

      setItems((prev) => prev.filter((x) => x.id !== deleteId));

      showToast("ลบบุคลากรถาวรแล้ว");
    } catch (err) {
      showToast(
        "ลบข้อมูลไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)),
        false
      );
    }

    setDeleteId(null);
  };

  // Helpers to reduce repetition
  const FI = (k: keyof FormData) => ({
    value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value })),
  });
  const FT = (k: keyof FormData) => ({
    value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value })),
  });

  const activeCount = items.filter((s) => s.is_active !== false).length;


  return (
    <div className="max-w-7xl mx-auto">
      <DashboardPageHeader
        title="บุคลากร"
        description={`ทั้งหมด ${items.length} คน · แสดงอยู่ ${activeCount} คน`}
        action={<AddButton label="เพิ่มบุคลากร" onClick={openAdd} />}
      />

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากชื่อ อีเมล หรือตำแหน่ง...">
<FilterSelect
  value={roleFilter}
  onChange={setRoleFilter}
  options={[
    { value: "all", label: "ทุกประเภท" },
    { value: "executive", label: "หัวหน้าสาขา" },
    { value: "teacher", label: "อาจารย์ประจำ" },
    { value: "officer", label: "เจ้าหน้าที่ธุรการประจำสาขาวิชา" },
    { value: "lab_officer", label: "เจ้าหน้าที่ประจำห้องปฏิบัติการ" },
  ]}
/>
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "active", label: "แสดงอยู่" },
            { value: "all", label: "ทั้งหมด" },
            { value: "inactive", label: "ซ่อนอยู่" },
          ]}
        />
      </SearchFilter>

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-sm text-slate-500">
          กำลังโหลด...
        </div>
      ) : (
        <TableShell>
          <thead className="bg-slate-50/60">
            <tr>
              <Th>บุคลากร</Th>
              <Th>ประเภท</Th>
              <Th>ติดต่อ</Th>
              <Th>ห้องพัก</Th>
              <Th>ลำดับ</Th>
              <Th className="text-right">จัดการ</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <EmptyRow colSpan={6} />
            ) : (
filtered.map((s) => (
  <tr key={s.id} className="hover:bg-slate-50/50">
    <Td>
      <div className="flex items-center gap-3">
        <CroppedImage
          src={s.image_url}
          fallbackSrc={FALLBACK}
          alt={s.image_alt || s.full_name}
          crop={s.image_crop_settings}
          className="h-10 w-10 shrink-0 rounded-xl bg-slate-100"
        />
        <div>
          <div className="font-medium text-slate-900">{s.full_name}</div>
          <div className="text-xs text-slate-500">{s.position || "-"}</div>
        </div>
      </div>
    </Td>

    <Td>
      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
        {ROLE_LABELS[s.role_type ?? ""] || s.role_type || "-"}
      </span>
    </Td>

    <Td className="text-xs text-slate-600">{s.email || "-"}</Td>

    <Td className="text-xs text-slate-500">{s.office || "-"}</Td>
<Td>
  <select
    value={s.sort_order ?? ""}
    onChange={async (e) => {
      const nextOrder = e.target.value === "" ? null : Number(e.target.value);

      const duplicate = items.find(
        (item) =>
          item.id !== s.id &&
          item.sort_order === nextOrder
      );

      if (duplicate) {
        showToast("ลำดับนี้ถูกเลือกแล้ว", false);
        return;
      }

      try {
        const updated = await staffApi.update(s.id, {
          sort_order: nextOrder,
        });

        setItems((prev) =>
          prev.map((item) => (item.id === s.id ? updated : item))
        );

        showToast("อัปเดตลำดับเรียบร้อยแล้ว");
      } catch (err) {
        showToast(
          "อัปเดตลำดับไม่สำเร็จ: " +
            (err instanceof Error ? err.message : String(err)),
          false
        );
      }
    }}
    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
  >
    <option value="">ไม่กำหนด</option>

    {Array.from({ length: items.length }, (_, i) => {
      const order = i + 1;
      const used = items.some(
        (item) => item.id !== s.id && item.sort_order === order
      );

      return (
        <option key={order} value={order} disabled={used}>
          {used ? `ลำดับ ${order} — ถูกเลือกแล้ว` : `ลำดับ ${order}`}
        </option>
      );
    })}
  </select>
</Td>

    <Td className="text-right">
      <div className="inline-flex gap-1">

        <button
          onClick={() => handleToggleActive(s)}
          className={
            s.is_active !== false
              ? "p-2 rounded-lg text-emerald-600 hover:bg-amber-50 hover:text-amber-600 transition"
              : "p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
          }
          title={s.is_active !== false ? "กดเพื่อซ่อนบุคลากร" : "กดเพื่อเปิดแสดงบุคลากร"}
        >
          {s.is_active !== false ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
                  <button
          onClick={() => openEdit(s)}
          className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition"
          title="แก้ไขข้อมูล"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button
          onClick={() => setDeleteId(s.id)}
          className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
          title="ลบถาวร"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Td>
  </tr>
))
            )}
          </tbody>
        </TableShell>
      )}

      {/* ─── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 z-40"
            onClick={() => !saving && setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl mx-auto my-8 shadow-2xl">
              {/* Modal header */}
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  {editingId ? "แก้ไขบุคลากร" : "เพิ่มบุคลากรใหม่"}
                </h2>
                <button
                  onClick={() => !saving && setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Validation errors */}
                {formErrors.length > 0 && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <ul className="text-xs text-rose-700 space-y-0.5">
                      {formErrors.map((e) => <li key={e}>{e}</li>)}
                    </ul>
                  </div>
                )}

                {/* Avatar + image URL */}
                <div className="flex items-start gap-4">
                  <CroppedImage
                    src={form.image_url || null}
                    fallbackSrc={FALLBACK}
                    alt="preview"
                    crop={form.image_crop_settings}
                    className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 bg-slate-100"
                  />
                  <div className="flex-1 space-y-2">
                    <CloudinaryImageUploader
                      value={form.image_url}
                      onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
                      folder="staff"
                      label="อัปโหลดรูปบุคลากร"
                    />
                    <FormInput label="URL รูปภาพ" placeholder="https://..." {...FI("image_url")} />
                    <FormInput label="Alt text" placeholder="คำอธิบายรูป" {...FI("image_alt")} />
                    {form.image_url && (
                      <ImageCropControls
                        imageUrl={form.image_url}
                        alt={form.image_alt || form.full_name || "staff photo"}
                        value={form.image_crop_settings}
                        onChange={(crop) => setForm((prev) => ({ ...prev, image_crop_settings: crop }))}
                        frameShape="circle"
                        aspectPreset="1:1"
                        previewClassName="aspect-square w-40"
                      />
                    )}
                  </div>
                </div>
                {/* Name + extra position */}
                {/* Name + main position */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormInput
                    label="ชื่อ-นามสกุล"
                    required
                    placeholder="ดร.ชื่อ นามสกุล"
                    {...FI("full_name")}
                  />

                  <FormSelect
                    label="ตำแหน่งหลัก"
                    value={form.role_type}
                    onChange={(e) => setForm((p) => ({ ...p, role_type: e.target.value }))}
                    options={ROLE_OPTIONS}
                  />
                </div>

                {/* Extra position */}
                <FormTextarea
                  label="ตำแหน่งเสริม"
                  hint="คั่นด้วย comma หรือขึ้นบรรทัดใหม่"
                  rows={3}
                  placeholder={`ประธานหลักสูตรปริญญาตรี
อาจารย์ประสานงานสหกิจภายในประเทศ`}
                  {...FT("position")}
                />

                {/* Sort order + status */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="ลำดับ"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                    options={sortOrderOptions}
                  />

                 <div>
  <Label>การแสดงผล</Label>
  <div className="h-11 flex items-center">
    <FormCheckbox
      label="แสดงบุคลากรคนนี้บนเว็บไซต์"
      checked={form.is_active}
      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
    />
  </div>
</div>
                </div>

                {/* Contact */}

<div className="grid gap-3 md:grid-cols-2">
  <FormTextarea
    label="อีเมล"
    hint="ใส่ได้หลายอีเมล คั่นด้วย comma หรือขึ้นบรรทัดใหม่"
    rows={2}
    {...FT("email")}
  />

  <FormTextarea
    label="โทรศัพท์"
    hint="ใส่ได้หลายเบอร์ คั่นด้วย comma หรือขึ้นบรรทัดใหม่"
    rows={2}
    {...FT("phone")}
  />

  <div className="md:col-span-1">
    <FormInput
      label="ห้องพัก"
      placeholder="ST 1801"
      {...FI("office")}
    />
  </div>
</div>


                {/* Education */}
                <FormTextarea
                  label="การศึกษา"
                  hint="กรอกได้หลายบรรทัด เช่น ปริญญาเอก / ปริญญาโท / ปริญญาตรี"
                  rows={3}
                  placeholder={`Ph.D. Computer Science, University Name
M.Sc. Information Technology, University Name
B.Sc. Computer Science, University Name`}
                  {...FT("education")}
                />
                {/* Expertise */}
                <FormTextarea
                  label="ความเชี่ยวชาญ"
                  hint="คั่นด้วย comma หรือขึ้นบรรทัดใหม่"
                  rows={2}
                  placeholder="Machine Learning, Web Development, ..."
                  {...FT("expertise_raw")}
                />

                {/* Bio */}
                <FormTextarea
                  label="ประวัติย่อ"
                  rows={3}
                  placeholder="เขียนสรุปประวัติสั้น ๆ..."
                  {...FT("bio")}
                />
              </div>

              {/* Modal footer */}
              <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มบุคลากร"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Confirm soft-delete ────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!confirmId}
        title="ซ่อนบุคลากรนี้?"
        description="บุคลากรจะไม่แสดงในเว็บไซต์ สามารถกู้คืนได้โดยกดแก้ไขและเปิด 'แสดงในเว็บไซต์'"
        variant="warning"
        confirmLabel="ซ่อน"
        onClose={() => setConfirmId(null)}
        onConfirm={handleSoftDelete}
      />
      <ConfirmModal
        open={!!deleteId}
        title="ลบบุคลากรนี้ถาวร?"
        description="ข้อมูลบุคลากรนี้จะถูกลบออกจากระบบถาวร และไม่สามารถกู้คืนได้"
        variant="danger"
        confirmLabel="ลบถาวร"
        onClose={() => setDeleteId(null)}
        onConfirm={handleHardDelete}
      />

      {/* ─── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${toast.ok ? "bg-slate-900" : "bg-rose-600"
            }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
