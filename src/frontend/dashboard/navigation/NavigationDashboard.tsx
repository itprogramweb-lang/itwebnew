"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  createNavigationItem,
  deleteNavigationItem,
  fetchNavigationItems,
  resetNavigationItems,
  updateNavigationItem,
  type NavigationItemPayload,
} from "@/frontend/api/navigation";
import type { NavigationItem } from "@/types";
import {
  emptyNavigationForm,
  getChildCounts,
  getFriendlyOrderMap,
  getNavigationDisplayItems,
  getNavigationGroupKey,
  getParentLabel,
  locationLabels,
  locationOptions,
  sortNavigationGroup,
  sortNavigationItems,
  targetOptions,
  toNavigationForm,
  typeOptions,
  validateNavigationForm,
  type NavigationForm,
} from "./navigationUtils";
import {
  AddButton,
  DashboardPageHeader,
  EmptyRow,
  FilterSelect,
  SearchFilter,
  TableShell,
  Td,
  Th,
} from "@/components/ui/DataTable";
import { FormCheckbox, FormInput, FormSelect, FormTextarea, Label } from "@/components/ui/Form";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";

const setupMessage =
  "ยังไม่ได้สร้างตาราง navigation_items ใน Supabase กรุณารัน SQL migration ก่อนใช้งานจริง";

const locationTabs = [
  { value: "all", label: "ทั้งหมด" },
  { value: "navbar", label: "Navbar" },
  { value: "footer_main", label: "Footer เมนูหลัก" },
  { value: "footer_students", label: "Footer สำหรับนักศึกษา" },
] as const;

type LocationFilter = (typeof locationTabs)[number]["value"];

function toPayload(form: NavigationForm): NavigationItemPayload {
  return {
    label: form.label.trim(),
    href: form.href.trim() || null,
    type: form.type,
    parent_id: form.parent_id || null,
    sort_order: Number(form.sort_order || 0),
    is_active: form.is_active,
    is_external: form.is_external,
    location: form.location,
    target: form.target || null,
    description: form.description.trim() || null,
  };
}

function isLikelyMissingMigration(message: string) {
  return (
    /navigation_items/i.test(message) ||
    /relation .*does not exist/i.test(message) ||
    /ไม่สามารถโหลดข้อมูลเมนู/.test(message)
  );
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "brand" | "green" | "amber" }) {
  const classes = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    brand: "border-brand-100 bg-brand-50 text-brand-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${classes[tone]}`}>
      {children}
    </span>
  );
}

export default function NavigationDashboard({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NavigationForm>(emptyNavigationForm());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const childCounts = useMemo(() => getChildCounts(items), [items]);
  const sortedItems = useMemo(() => sortNavigationItems(items), [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filteredItems = sortedItems.filter((item) => {
      const matchesQ =
        !query ||
        item.label.toLowerCase().includes(query) ||
        (item.href ?? "").toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query);
      const matchesLocation = locationFilter === "all" || item.location === locationFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.is_active !== false) ||
        (statusFilter === "inactive" && item.is_active === false);
      return matchesQ && matchesLocation && matchesStatus;
    });
    return getNavigationDisplayItems(filteredItems);
  }, [locationFilter, q, sortedItems, statusFilter]);

  const friendlyOrderMap = useMemo(() => getFriendlyOrderMap(filtered), [filtered]);

  const parentOptions = useMemo(
    () => [
      { value: "", label: "ไม่มี parent" },
      ...sortedItems
        .filter((item) => item.id !== editingId && (item.type === "dropdown" || item.type === "heading"))
        .map((item) => ({
          value: item.id,
          label: `${item.label} (${item.location})`,
        })),
    ],
    [editingId, sortedItems]
  );

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const resetScope = locationFilter === "all" ? "all" : locationFilter;
  const resetScopeLabel =
    resetScope === "all" ? "ทุกตำแหน่ง" : locationLabels[resetScope as keyof typeof locationLabels];

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={() => setResetOpen(true)}
        disabled={!!listError || resetting}
        className="gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        รีเซตเมนูหลัก
      </Button>
      <AddButton label="เพิ่มเมนู" onClick={openAdd} disabled={!!listError} />
    </div>
  );

  async function loadItems() {
    setLoading(true);
    setListError(null);
    try {
      const data = await fetchNavigationItems();
      setItems(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "โหลดข้อมูลเมนูไม่สำเร็จ";
      setListError(isLikelyMissingMigration(message) ? setupMessage : message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyNavigationForm());
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(item: NavigationItem) {
    setEditingId(item.id);
    setForm(toNavigationForm(item));
    setFormErrors([]);
    setModalOpen(true);
  }

  function setField<K extends keyof NavigationForm>(key: K, value: NavigationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const errors = validateNavigationForm(form);
    if (editingId && form.parent_id === editingId) errors.push("ไม่สามารถเลือก parent เป็นรายการตัวเองได้");
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors([]);
    try {
      if (editingId) {
        const updated = await updateNavigationItem(editingId, toPayload(form));
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        showToast("บันทึกเมนูเรียบร้อยแล้ว");
      } else {
        const created = await createNavigationItem(toPayload(form));
        setItems((prev) => [...prev, created]);
        showToast("เพิ่มเมนูเรียบร้อยแล้ว");
      }
      setModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: NavigationItem) {
    try {
      const updated = await updateNavigationItem(item.id, {
        label: item.label,
        href: item.href,
        type: item.type,
        parent_id: item.parent_id,
        sort_order: item.sort_order,
        is_active: item.is_active === false,
        is_external: item.is_external,
        location: item.location,
        target: item.target,
        description: item.description,
      });
      setItems((prev) => prev.map((current) => (current.id === item.id ? updated : current)));
      showToast(updated.is_active ? "เปิดใช้งานเมนูแล้ว" : "ปิดใช้งานเมนูแล้ว");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "เปลี่ยนสถานะไม่สำเร็จ", false);
    }
  }

  async function handleSortOrderChange(item: NavigationItem, value: string) {
    const sortOrder = Number(value);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      showToast("ลำดับต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป", false);
      return;
    }
    try {
      const updated = await updateNavigationItem(item.id, {
        label: item.label,
        href: item.href,
        type: item.type,
        parent_id: item.parent_id,
        sort_order: sortOrder,
        is_active: item.is_active,
        is_external: item.is_external,
        location: item.location,
        target: item.target,
        description: item.description,
      });
      setItems((prev) => prev.map((current) => (current.id === item.id ? updated : current)));
      showToast("อัปเดตลำดับเรียบร้อยแล้ว");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "อัปเดตลำดับไม่สำเร็จ", false);
    }
  }

  async function handleMove(item: NavigationItem, direction: "up" | "down") {
    const group = sortNavigationGroup(
      items.filter((current) => getNavigationGroupKey(current) === getNavigationGroupKey(item))
    );
    const currentIndex = group.findIndex((current) => current.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= group.length) return;

    const reordered = [...group];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      const updatedGroup = await Promise.all(
        reordered.map((current, index) =>
          updateNavigationItem(current.id, { sort_order: index + 1 })
        )
      );

      const updates = new Map(updatedGroup.map((current) => [current.id, current]));
      setItems((prev) => prev.map((current) => updates.get(current.id) ?? current));
      showToast("อัปเดตลำดับเมนูเรียบร้อยแล้ว");
      await loadItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "อัปเดตลำดับเมนูไม่สำเร็จ", false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteNavigationItem(deleteId);
      setItems((prev) =>
        prev.map((item) => (item.id === deleteId ? { ...item, is_active: false } : item))
      );
      showToast("ปิดใช้งานเมนูแล้ว");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ลบเมนูไม่สำเร็จ", false);
    } finally {
      setDeleteId(null);
    }
  }

  async function handleResetCoreItems() {
    setResetting(true);
    try {
      const navigation = await resetNavigationItems({ location: resetScope });
      setItems(navigation);
      showToast("รีเซตเมนูหลักแล้ว");
      await loadItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "รีเซตเมนูหลักไม่สำเร็จ", false);
    } finally {
      setResetting(false);
    }
  }

  const editingItem = editingId ? items.find((item) => item.id === editingId) ?? null : null;

  return (
    <div className="mx-auto max-w-7xl">
      {embedded ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">จัดการเมนู</h2>
            <p className="text-sm text-slate-500">
              ทั้งหมด {items.length} รายการ · แสดงอยู่ {items.filter((item) => item.is_active !== false).length} รายการ
            </p>
          </div>
          {headerActions}
        </div>
      ) : (
        <DashboardPageHeader
          title="จัดการเมนูเว็บไซต์"
          description={`ทั้งหมด ${items.length} รายการ · แสดงอยู่ ${items.filter((item) => item.is_active !== false).length} รายการ`}
          action={headerActions}
        />
      )}

      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="space-y-1">
          <p className="font-semibold text-amber-900">
            เมนู Navbar และ MobileMenu ใช้ข้อมูลจากหน้านี้แล้ว ส่วน Footer ยังใช้โครงสร้างเดิมอยู่
          </p>
          <p>
            ถ้าข้อมูลเมนูโหลดไม่ได้ หน้าเว็บจะใช้เมนูสำรองเดิมอัตโนมัติ เมนูหลัก (Core Item) ไม่สามารถลบได้ แต่ยังสามารถปรับลำดับหรือปิดการใช้งานได้ตามปกติ และสามารถรีเซตเป็นค่าเริ่มต้นได้เสมอ
          </p>
        </div>
      </div>

      {listError && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-medium text-rose-700">{listError}</p>
            <button
              type="button"
              onClick={loadItems}
              className="mt-2 text-xs font-medium text-rose-700 underline underline-offset-2"
            >
              ลองโหลดใหม่
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-white p-2">
        {locationTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setLocationFilter(tab.value)}
            className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
              locationFilter === tab.value
                ? "bg-brand-gradient text-white shadow-brand"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากชื่อเมนู, href หรือตำแหน่ง...">
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
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
          กำลังโหลด...
        </div>
      ) : (
        <TableShell>
          <thead className="bg-slate-50/60">
            <tr>
              <Th>ลำดับ</Th>
              <Th>เมนู</Th>
              <Th>Href</Th>
              <Th>ตำแหน่ง</Th>
              <Th>ชนิด</Th>
              <Th>Parent</Th>
              <Th>จัดลำดับ</Th>
              <Th>สถานะ</Th>
              <Th className="text-right">จัดการ</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <EmptyRow colSpan={9} label={listError ? "ยังโหลดข้อมูลไม่ได้" : "ไม่พบเมนู"} />
            ) : (
              filtered.map((item) => {
                const childCount = childCounts.get(item.id) ?? 0;
                const deleteDisabled = item.is_core || childCount > 0;
                const group = sortNavigationGroup(
                  items.filter((current) => getNavigationGroupKey(current) === getNavigationGroupKey(item))
                );
                const groupIndex = group.findIndex((current) => current.id === item.id);
                const canMoveUp = groupIndex > 0;
                const canMoveDown = groupIndex >= 0 && groupIndex < group.length - 1;
                const isChild = Boolean(item.parent_id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <Td>
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-semibold text-slate-700">
                        {friendlyOrderMap.get(item.id) ?? "-"}
                      </span>
                    </Td>
                    <Td>
                      <div className={`space-y-1 ${isChild ? "border-l-2 border-slate-200 pl-3" : ""}`}>
                        <div className={isChild ? "text-sm font-medium text-slate-700" : "font-semibold text-slate-900"}>
                          {isChild ? "↳ " : ""}
                          {item.label}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.is_core && <Badge tone="brand">เมนูหลัก</Badge>}
                          {item.is_external && <Badge tone="amber">external</Badge>}
                          {childCount > 0 && <Badge>{childCount} เมนูย่อย</Badge>}
                        </div>
                      </div>
                    </Td>
                    <Td className="max-w-[240px] truncate text-xs text-slate-600">{item.href || "-"}</Td>
                    <Td><Badge>{locationLabels[item.location]}</Badge></Td>
                    <Td><Badge tone={item.type === "link" ? "green" : "slate"}>{item.type}</Badge></Td>
                    <Td className="text-xs text-slate-600">{getParentLabel(items, item.parent_id)}</Td>
                    <Td>
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(item, "up")}
                          disabled={!canMoveUp}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                        >
                          ขึ้น
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(item, "down")}
                          disabled={!canMoveDown}
                          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                        >
                          ลง
                        </button>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={item.is_active !== false ? "green" : "slate"}>
                        {item.is_active !== false ? "แสดง" : "ซ่อน"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                          title={item.is_active !== false ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        >
                          {item.is_active !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-600"
                          title="แก้ไข"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => !deleteDisabled && setDeleteId(item.id)}
                          disabled={deleteDisabled}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                          title={
                            item.is_core
                              ? "เมนูหลักไม่สามารถลบได้"
                              : childCount > 0
                                ? "เมนูที่มีเมนูย่อยยังลบไม่ได้"
                                : "ปิดใช้งานเมนู"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </TableShell>
      )}

      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => !saving && setModalOpen(false)} />
          <div className="fixed inset-0 z-50 overflow-y-auto p-4">
            <div className="mx-auto my-8 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {editingId ? "แก้ไขเมนู" : "เพิ่มเมนูใหม่"}
                  </h2>
                  {editingItem?.is_core && <p className="mt-1 text-xs text-brand-600">เมนูหลักของระบบ</p>}
                </div>
                <button
                  type="button"
                  onClick={() => !saving && setModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="ปิด"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 p-6">
                {formErrors.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <ul className="space-y-0.5 text-xs text-rose-700">
                      {formErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="ชื่อเมนู"
                    required
                    value={form.label}
                    onChange={(event) => setField("label", event.target.value)}
                    placeholder="เช่น สมัครเรียน"
                  />
                  <FormSelect
                    label="ชนิดเมนู"
                    value={form.type}
                    onChange={(event) => setField("type", event.target.value as NavigationForm["type"])}
                    options={typeOptions}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormInput
                    label="Href"
                    required={form.type === "link"}
                    value={form.href}
                    onChange={(event) => setField("href", event.target.value)}
                    placeholder={form.is_external ? "https://..." : "/about"}
                  />
                  <FormSelect
                    label="ตำแหน่ง"
                    value={form.location}
                    onChange={(event) => setField("location", event.target.value as NavigationForm["location"])}
                    options={locationOptions}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormSelect
                    label="Parent"
                    value={form.parent_id}
                    onChange={(event) => setField("parent_id", event.target.value)}
                    options={parentOptions}
                    hint={editingItem?.is_core ? "เมนูหลักไม่ควรย้าย parent" : undefined}
                  />
                  <div>
                    <FormInput
                      label="ลำดับขั้นสูง"
                      type="number"
                      value={form.sort_order}
                      onChange={(event) => setField("sort_order", event.target.value)}
                      required
                      hint="ใช้เมื่อจำเป็น"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      ปกติให้ใช้ปุ่มเลื่อนขึ้น/ลง ระบบจะจัดลำดับให้อัตโนมัติ
                    </p>
                  </div>
                  <FormSelect
                    label="Target"
                    value={form.target}
                    onChange={(event) => setField("target", event.target.value as NavigationForm["target"])}
                    options={targetOptions}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>การแสดงผล</Label>
                    <div className="flex h-11 items-center">
                      <FormCheckbox
                        label="เปิดใช้งาน"
                        checked={form.is_active}
                        onChange={(event) => setField("is_active", event.target.checked)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>External link</Label>
                    <div className="flex h-11 items-center">
                      <FormCheckbox
                        label="เป็นลิงก์ภายนอก"
                        checked={form.is_external}
                        onChange={(event) => {
                          setField("is_external", event.target.checked);
                          if (event.target.checked && !form.target) setField("target", "_blank");
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Core</Label>
                    <div className="flex h-11 items-center">
                      <span className="text-sm text-slate-500">
                        {editingItem?.is_core ? "เมนูหลัก (แก้ค่านี้ไม่ได้)" : "เมนู custom"}
                      </span>
                    </div>
                  </div>
                </div>

                <FormTextarea
                  label="คำอธิบาย"
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  rows={3}
                  placeholder="ใช้แสดงรายละเอียดของ dropdown หรือบันทึกช่วยจำ"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!deleteId}
        title="ปิดใช้งานเมนูนี้?"
        description="ระบบจะ soft delete โดยตั้งค่า is_active = false ข้อมูลยังอยู่ในระบบ"
        variant="warning"
        confirmLabel="ปิดใช้งาน"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        open={resetOpen}
        title="รีเซตเมนูหลัก?"
        description={`ต้องการรีเซตเมนูหลักกลับเป็นค่าเริ่มต้นหรือไม่? เมนูที่เพิ่มเองจะไม่ถูกลบ ขอบเขต: ${resetScopeLabel}`}
        variant="warning"
        confirmLabel={resetting ? "กำลังรีเซต..." : "ยืนยันรีเซต"}
        cancelLabel="ยกเลิก"
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetCoreItems}
      />

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white shadow-lg ${
            toast.ok ? "bg-slate-900" : "bg-rose-600"
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-200" />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
