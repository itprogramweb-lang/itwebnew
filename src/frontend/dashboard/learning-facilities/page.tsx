"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Eye,
    EyeOff,
    FlaskConical,
    Images,
    Pencil,
    Trash2,
    X,
} from "lucide-react";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
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
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormCheckbox, FormInput, FormSelect, FormTextarea, Label } from "@/components/ui/Form";
import CroppedImage from "@/components/ui/CroppedImage";
import { getAuthHeaders } from "@/frontend/api/http";
import { cropToJson, getDefaultImageCrop, type ImageCropSettings } from "@/lib/imageCrop";

type GalleryImageForm = {
    url: string;
    alt: string;
    caption: string;
    sort_order: number;
};

type LearningFacilityRow = {
    id: string;
    type: string;
    title: string;
    slug: string | null;
    short_description: string | null;
    description: string | null;
    cover_image_url: string | null;
    cover_image_alt: string | null;
    cover_image_crop: ImageCropSettings | Record<string, unknown> | string | null;
    gallery_images: GalleryImageForm[] | null;
    location: string | null;
    capacity: string | null;
    highlights: string[] | null;
    equipment_list: string[] | null;
    is_featured: boolean | null;
    is_active: boolean | null;
    sort_order: number | null;
    created_at: string | null;
    updated_at: string | null;
};

type FacilityForm = {
    type: string;
    title: string;
    slug: string;
    short_description: string;
    description: string;
    cover_image_url: string;
    cover_image_alt: string;
    cover_image_crop: ImageCropSettings;
    gallery_images: GalleryImageForm[];
    location: string;
    capacity: string;
    highlights_raw: string;
    equipment_list_raw: string;
    is_featured: boolean;
    is_active: boolean;
    sort_order: string;
};

type LearningFacilitiesApiResponse = {
    facilities?: LearningFacilityRow[];
    facility?: LearningFacilityRow;
    ok?: boolean;
    error?: string;
};

const TYPE_OPTIONS = [
    { value: "lab", label: "ห้องปฏิบัติการ" },
    { value: "equipment", label: "อุปกรณ์การเรียน" },
    { value: "network", label: "อุปกรณ์เครือข่าย" },
    { value: "project_space", label: "พื้นที่ทำโปรเจกต์" },
    { value: "gallery", label: "บรรยากาศการเรียน" },
];

const FALLBACK = "/placeholders/facility-placeholder.svg";

const DEFAULT_COVER_CROP = getDefaultImageCrop({
    frameShape: "rounded",
    aspectPreset: "16:9",
});

const EMPTY_FORM: FacilityForm = {
    type: "lab",
    title: "",
    slug: "",
    short_description: "",
    description: "",
    cover_image_url: "",
    cover_image_alt: "",
    cover_image_crop: DEFAULT_COVER_CROP,
    gallery_images: [],
    location: "",
    capacity: "",
    highlights_raw: "",
    equipment_list_raw: "",
    is_featured: false,
    is_active: true,
    sort_order: "",
};

function createEmptyForm(): FacilityForm {
    return {
        ...EMPTY_FORM,
        cover_image_crop: getDefaultImageCrop({
            frameShape: "rounded",
            aspectPreset: "16:9",
        }),
        gallery_images: [],
    };
}

function typeLabel(type: string) {
    if (type === "lab") return "ห้องปฏิบัติการ";
    if (type === "equipment") return "อุปกรณ์การเรียน";
    if (type === "network") return "อุปกรณ์เครือข่าย";
    if (type === "project_space") return "พื้นที่ทำโปรเจกต์";
    if (type === "gallery") return "บรรยากาศการเรียน";
    return type || "-";
}

function toSlug(value: string) {
    return (
        value
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\u0E00-\u0E7F-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "facility"
    );
}

function splitMultiValue(value: string): string[] {
    return value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function arrayToText(value: string[] | null | undefined): string {
    return Array.isArray(value) ? value.join("\n") : "";
}

function normalizeCoverCrop(
    value: LearningFacilityRow["cover_image_crop"] | null | undefined,
): ImageCropSettings {
    if (!value) {
        return getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" });
    }

    try {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        if (!parsed || typeof parsed !== "object") {
            return getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" });
        }
        return cropToJson(parsed as Record<string, unknown>);
    } catch {
        return getDefaultImageCrop({ frameShape: "rounded", aspectPreset: "16:9" });
    }
}

function normalizeCropForDisplay(
    value: LearningFacilityRow["cover_image_crop"],
): ImageCropSettings | null {
    if (!value) return null;

    if (typeof value === "string") {
        try {
            return JSON.parse(value) as ImageCropSettings;
        } catch {
            return null;
        }
    }

    return value as ImageCropSettings;
}

function normalizeGalleryImages(value: unknown): GalleryImageForm[] {
    if (!Array.isArray(value)) return [];

    return value
        .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const img = item as Partial<GalleryImageForm>;
            const url = typeof img.url === "string" ? img.url.trim() : "";
            if (!url) return null;

            return {
                url,
                alt: typeof img.alt === "string" ? img.alt : "",
                caption: typeof img.caption === "string" ? img.caption : "",
                sort_order: Number(img.sort_order) || index + 1,
            };
        })
        .filter((item): item is GalleryImageForm => Boolean(item));
}

function toForm(item: LearningFacilityRow): FacilityForm {
    return {
        type: item.type || "lab",
        title: item.title || "",
        slug: item.slug || "",
        short_description: item.short_description || "",
        description: item.description || "",
        cover_image_url: item.cover_image_url || "",
        cover_image_alt: item.cover_image_alt || "",
        cover_image_crop: normalizeCoverCrop(item.cover_image_crop),
        gallery_images: normalizeGalleryImages(item.gallery_images),
        location: item.location || "",
        capacity: item.capacity || "",
        highlights_raw: arrayToText(item.highlights),
        equipment_list_raw: arrayToText(item.equipment_list),
        is_featured: item.is_featured ?? false,
        is_active: item.is_active ?? true,
        sort_order: item.sort_order === null || item.sort_order === undefined ? "" : String(item.sort_order),
    };
}

function toPayload(form: FacilityForm) {
    return {
        type: form.type,
        title: form.title.trim(),
        slug: form.slug.trim() || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
        cover_image_alt: form.cover_image_alt.trim() || null,
        cover_image_crop: cropToJson(form.cover_image_crop),
        gallery_images: form.gallery_images
            .filter((img) => img.url.trim())
            .map((img, index) => ({
                url: img.url.trim(),
                alt: img.alt.trim() || null,
                caption: img.caption.trim() || null,
                sort_order: Number.isFinite(Number(img.sort_order)) ? Number(img.sort_order) : index + 1,
            })),
        location: form.location.trim() || null,
        capacity: form.capacity.trim() || null,
        highlights: splitMultiValue(form.highlights_raw),
        equipment_list: splitMultiValue(form.equipment_list_raw),
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: form.sort_order === "" ? null : Number(form.sort_order),
    };
}

export default function LearningFacilitiesDashboard() {
    const [items, setItems] = useState<LearningFacilityRow[]>([]);
    const [form, setForm] = useState<FacilityForm>(createEmptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [q, setQ] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
   const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        window.setTimeout(() => setToast(null), 2600);
    };

    const loadItems = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch("/api/admin/learning-facilities", { headers });
            const data = (await res.json()) as LearningFacilitiesApiResponse;

            if (!res.ok) {
                throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
            }

            setItems(data.facilities ?? []);
        } catch (err) {
            showToast(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ", false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const sortOrderOptions = useMemo(() => {
        const count = Math.max(items.length + (editingId ? 0 : 1), 1);
        return [
            { value: "", label: "ไม่กำหนด" },
            ...Array.from({ length: count }, (_, i) => ({
                value: String(i + 1),
                label: `ลำดับ ${i + 1}`,
            })),
        ];
    }, [items.length, editingId]);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();

        return items.filter((item) => {
            const text = [
                item.title,
                item.slug,
                item.type,
                typeLabel(item.type),
                item.short_description,
                item.description,
                item.location,
                item.capacity,
                ...(item.highlights ?? []),
                ...(item.equipment_list ?? []),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchQ = !query || text.includes(query);
            const matchType = typeFilter === "all" || item.type === typeFilter;
            const matchStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.is_active !== false) ||
                (statusFilter === "inactive" && item.is_active === false);

            return matchQ && matchType && matchStatus;
        });
    }, [items, q, typeFilter, statusFilter]);

    const activeCount = items.filter((item) => item.is_active !== false).length;

    const openAdd = () => {
        setEditingId(null);
        setForm(createEmptyForm());
        setFormErrors([]);
        setModalOpen(true);
    };

    const openEdit = (item: LearningFacilityRow) => {
        setEditingId(item.id);
        setForm(toForm(item));
        setFormErrors([]);
        setModalOpen(true);
    };

    const validate = () => {
        const errors: string[] = [];
        if (!form.title.trim()) errors.push("กรุณากรอกชื่อรายการ");
        if (!form.type.trim()) errors.push("กรุณาเลือกประเภท");
        return errors;
    };

    const handleSave = async () => {
        const errors = validate();
        setFormErrors(errors);
        if (errors.length > 0) return;

        setSaving(true);

        try {
            const headers = await getAuthHeaders();
            const payload = toPayload(form);
            const res = await fetch("/api/admin/learning-facilities", {
                method: editingId ? "PATCH" : "POST",
                headers,
                body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
            });

            const data = (await res.json()) as LearningFacilitiesApiResponse;

            if (!res.ok || !data.facility) {
                throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
            }

            const saved = data.facility;

            setItems((prev) =>
                editingId ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev],
            );
            setEditingId(saved.id);
            setForm(toForm(saved));
            showToast(editingId ? "บันทึกการแก้ไขเรียบร้อยแล้ว" : "เพิ่มข้อมูลเรียบร้อยแล้ว");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ", false);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (item: LearningFacilityRow) => {
        setSaving(true);

        try {
            const headers = await getAuthHeaders();
            const nextForm = toForm(item);
            nextForm.is_active = item.is_active === false;
            const payload = toPayload(nextForm);

            const res = await fetch("/api/admin/learning-facilities", {
                method: "PATCH",
                headers,
                body: JSON.stringify({ id: item.id, ...payload }),
            });

            const data = (await res.json()) as LearningFacilitiesApiResponse;

            if (!res.ok || !data.facility) {
                throw new Error(data.error || "เปลี่ยนสถานะไม่สำเร็จ");
            }

            const updated = data.facility;
            setItems((prev) => prev.map((old) => (old.id === updated.id ? updated : old)));
            showToast(updated.is_active === false ? "ซ่อนข้อมูลแล้ว" : "เปิดแสดงข้อมูลแล้ว");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "เปลี่ยนสถานะไม่สำเร็จ", false);
        } finally {
            setSaving(false);
        }
    };

    const handleHardDelete = async () => {
        if (!deleteId) return;

        try {
            const headers = await getAuthHeaders();
            const res = await fetch(
                `/api/admin/learning-facilities?id=${encodeURIComponent(deleteId)}&mode=delete`,
                { method: "DELETE", headers },
            );
            const data = (await res.json()) as LearningFacilitiesApiResponse;

            if (!res.ok) {
                throw new Error(data.error || "ลบข้อมูลไม่สำเร็จ");
            }

            setItems((prev) => prev.filter((item) => item.id !== deleteId));
            showToast("ลบข้อมูลถาวรแล้ว");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "ลบข้อมูลไม่สำเร็จ", false);
        }

        setDeleteId(null);
    };

    const addGalleryImage = (url: string) => {
        setForm((prev) => ({
            ...prev,
            gallery_images: [
                ...prev.gallery_images,
                {
                    url,
                    alt: "",
                    caption: "",
                    sort_order: prev.gallery_images.length + 1,
                },
            ],
        }));
    };

    const removeGalleryImage = (index: number) => {
        setForm((prev) => ({
            ...prev,
            gallery_images: prev.gallery_images.filter((_, i) => i !== index),
        }));
    };

    const updateGalleryImage = (
        index: number,
        field: keyof GalleryImageForm,
        value: string | number,
    ) => {
        setForm((prev) => ({
            ...prev,
            gallery_images: prev.gallery_images.map((img, i) =>
                i === index ? { ...img, [field]: value } : img,
            ),
        }));
    };

    const FI = (k: keyof FacilityForm) => ({
        value: String(form[k] ?? ""),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, [k]: e.target.value })),
    });

    const FT = (k: keyof FacilityForm) => ({
        value: String(form[k] ?? ""),
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setForm((prev) => ({ ...prev, [k]: e.target.value })),
    });

    return (
        <div className="max-w-7xl mx-auto">
            <DashboardPageHeader
                title="อุปกรณ์และห้องปฏิบัติการ"
                description={`ทั้งหมด ${items.length} รายการ · แสดงอยู่ ${activeCount} รายการ`}
                action={<AddButton label="เพิ่มข้อมูล" onClick={openAdd} />}
            />

            <SearchFilter value={q} onChange={setQ} placeholder="ค้นหาจากชื่อ ประเภท สถานที่ หรือรายละเอียด...">
                <FilterSelect
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                        { value: "all", label: "ทุกประเภท" },
                        ...TYPE_OPTIONS,
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
                            <Th>ชื่อรายการ</Th>
                            <Th>ประเภท</Th>
                            <Th>สถานที่</Th>
                            <Th className="text-right">จัดการ</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <EmptyRow colSpan={4} />
                        ) : (
                            filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <CroppedImage
                                                src={item.cover_image_url}
                                                fallbackSrc={FALLBACK}
                                                alt={item.cover_image_alt || item.title}
                                                crop={normalizeCropForDisplay(item.cover_image_crop)}
                                                className="h-12 w-16 shrink-0 rounded-xl bg-slate-100"
                                            />
                                            <div className="min-w-0">
                                                <div className="font-medium text-slate-900">{item.title}</div>
                                                <div className="text-xs text-slate-500">
                                                    {(() => {
                                                        const text = item.short_description || item.slug || "-";
                                                        return text.length > 50 ? text.slice(0, 50) + "..." : text;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>

                                    <Td>
                                        <span className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                                            {typeLabel(item.type)}
                                        </span>
                                    </Td>

                                    <Td className="text-xs text-slate-600">{item.location || "-"}</Td>

                                    <Td className="text-right">
                                        <div className="inline-flex gap-1">
                                            <button
                                                onClick={() => handleToggleActive(item)}
                                                className={
                                                    item.is_active !== false
                                                        ? "rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                                                        : "rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                                                }
                                                title={item.is_active !== false ? "กดเพื่อซ่อนข้อมูล" : "กดเพื่อเปิดแสดงข้อมูล"}
                                            >
                                                {item.is_active !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </button>

                                            <button
                                                onClick={() => openEdit(item)}
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-600"
                                                title="แก้ไขข้อมูล"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => setDeleteId(item.id)}
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                                title="ลบถาวร"
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
            )}

            {modalOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-slate-100/70 backdrop-blur-[1px]"
                        onClick={() => !saving && setModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
                        <div className="my-8 mx-auto w-full max-w-4xl rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        {editingId ? "แก้ไขอุปกรณ์และห้องปฏิบัติการ" : "เพิ่มอุปกรณ์และห้องปฏิบัติการ"}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        รูปจริงเก็บใน Cloudinary ส่วน Supabase เก็บ URL และรายละเอียด
                                    </p>
                                </div>
                                <button
                                    onClick={() => !saving && setModalOpen(false)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-5 p-6">
                                {formErrors.length > 0 && (
                                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                        <ul className="space-y-0.5 text-xs text-rose-700">
                                            {formErrors.map((e) => (
                                                <li key={e}>{e}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <FlaskConical className="h-4 w-4 text-brand-600" />
                                        ข้อมูลหลัก
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormInput
                                            label="ชื่อรายการ"
                                            required
                                            placeholder="ห้องปฏิบัติการคอมพิวเตอร์"
                                            {...FI("title")}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setForm((prev) => ({
                                                    ...prev,
                                                    title: value,
                                                    slug: editingId ? prev.slug : toSlug(value),
                                                }));
                                            }}
                                        />
                                        <FormInput label="Slug" placeholder="computer-lab" {...FI("slug")} />
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                        <FormSelect
                                            label="ประเภท"
                                            value={form.type}
                                            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                                            options={TYPE_OPTIONS}
                                        />
                                        <FormInput label="สถานที่" placeholder="ST 1801" {...FI("location")} />
                                        <FormInput label="จำนวนรองรับ" placeholder="40 ที่นั่ง" {...FI("capacity")} />
                                        <FormSelect
                                            label="ลำดับ"
                                            value={form.sort_order}
                                            onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                                            options={sortOrderOptions}
                                        />
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>รายการเด่น</Label>
                                            <div className="flex h-11 items-center">
                                                <FormCheckbox
                                                    label="แสดงเป็นรายการเด่นบนหน้าเว็บ"
                                                    checked={form.is_featured}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>การแสดงผล</Label>
                                            <div className="flex h-11 items-center">
                                                <FormCheckbox
                                                    label="เปิดแสดงรายการนี้บนเว็บไซต์"
                                                    checked={form.is_active}
                                                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                                    <div className="mb-4 text-sm font-semibold text-slate-900">รายละเอียดเนื้อหา</div>
                                    <div className="space-y-4">
                                        <FormTextarea
                                            label="คำอธิบายสั้น"
                                            rows={3}
                                            placeholder="สรุปสั้น ๆ ที่ใช้แสดงบนการ์ด"
                                            {...FT("short_description")}
                                        />
                                        <FormTextarea
                                            label="รายละเอียดเต็ม"
                                            rows={5}
                                            placeholder="อธิบายรายละเอียดของห้อง อุปกรณ์ หรือบรรยากาศการเรียน"
                                            {...FT("description")}
                                        />
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormTextarea
                                                label="จุดเด่น"
                                                hint="คั่นด้วย comma หรือขึ้นบรรทัดใหม่"
                                                rows={4}
                                                placeholder={`เครื่องคอมพิวเตอร์พร้อมใช้งาน\nอินเทอร์เน็ตความเร็วสูง\nซอฟต์แวร์สำหรับการเรียน`}
                                                {...FT("highlights_raw")}
                                            />
                                            <FormTextarea
                                                label="รายการอุปกรณ์"
                                                hint="คั่นด้วย comma หรือขึ้นบรรทัดใหม่"
                                                rows={4}
                                                placeholder={`Router\nSwitch\nMicrocontroller Board`}
                                                {...FT("equipment_list_raw")}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <Images className="h-4 w-4 text-brand-600" />
                                        รูปปก
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                                        <CroppedImage
                                            src={form.cover_image_url || null}
                                            fallbackSrc={FALLBACK}
                                            alt={form.cover_image_alt || form.title || "facility cover"}
                                            crop={form.cover_image_crop}
                                            className="aspect-video w-full rounded-2xl border border-slate-200 bg-slate-100"
                                        />
                                        <div className="space-y-3">
                                            <CloudinaryImageUploader
                                                value={form.cover_image_url}
                                                onChange={(url) => setForm((prev) => ({ ...prev, cover_image_url: url }))}
                                                folder="facilities"
                                                label="อัปโหลดรูปปก"
                                            />
                                            <FormInput label="URL รูปปก" placeholder="https://..." {...FI("cover_image_url")} />
                                            <FormInput label="Alt text" placeholder="คำอธิบายรูป" {...FI("cover_image_alt")} />
                                            {form.cover_image_url && (
                                                <ImageCropControls
                                                    imageUrl={form.cover_image_url}
                                                    alt={form.cover_image_alt || form.title || "facility cover"}
                                                    value={form.cover_image_crop}
                                                    onChange={(crop) => setForm((prev) => ({ ...prev, cover_image_crop: crop }))}
                                                    frameShape="rounded"
                                                    aspectPreset="16:9"
                                                    previewClassName="aspect-video w-52"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">รูป Gallery</div>
                                            <p className="text-xs text-slate-500">
                                                เพิ่มรูปหลายรูปเพื่อโชว์บรรยากาศจริงของห้องและอุปกรณ์
                                            </p>
                                        </div>
                                    </div>

                                    <CloudinaryImageUploader
                                        value=""
                                        onChange={(url) => addGalleryImage(url)}
                                        folder="facilities/gallery"
                                        label="เพิ่มรูป Gallery"
                                    />

                                    {form.gallery_images.length > 0 && (
                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            {form.gallery_images.map((img, index) => (
                                                <div key={`${img.url}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                                                    <img
                                                        src={img.url}
                                                        alt={img.alt || form.title || "gallery image"}
                                                        className="mb-3 h-44 w-full rounded-xl object-cover"
                                                    />
                                                    <div className="space-y-2">
                                                        <input
                                                            value={img.alt}
                                                            onChange={(e) => updateGalleryImage(index, "alt", e.target.value)}
                                                            placeholder="Alt text"
                                                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                        />
                                                        <input
                                                            value={img.caption}
                                                            onChange={(e) => updateGalleryImage(index, "caption", e.target.value)}
                                                            placeholder="คำบรรยายรูป"
                                                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={img.sort_order}
                                                                onChange={(e) => updateGalleryImage(index, "sort_order", Number(e.target.value) || index + 1)}
                                                                className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeGalleryImage(index)}
                                                                className="h-10 rounded-xl px-3 text-sm text-rose-600 transition hover:bg-rose-50"
                                                            >
                                                                ลบรูป
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                                <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
                                    ยกเลิก
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <ConfirmModal
                open={!!deleteId}
                title="ลบข้อมูลนี้ถาวร?"
                description="ข้อมูลอุปกรณ์หรือห้องปฏิบัติการนี้จะถูกลบออกจากระบบถาวร และไม่สามารถกู้คืนได้"
                variant="danger"
                confirmLabel="ลบถาวร"
                onClose={() => setDeleteId(null)}
                onConfirm={handleHardDelete}
            />

            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-white shadow-lg ${toast.ok ? "bg-slate-900" : "bg-rose-600"
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
