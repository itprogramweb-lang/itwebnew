"use client";

import { useState, useEffect, useCallback } from "react";
import { heroSlidesApi } from "@/frontend/api/heroSlides";
import {
  Plus, Pencil, EyeOff, Copy,
  Loader2, AlertCircle, CheckCircle2, X, ImageOff,
  Trash2,
  Eye,
} from "lucide-react";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import CroppedImage from "@/components/ui/CroppedImage";
import { cn } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Button from "@/components/ui/Button";
import { cropToJson, getDefaultImageCrop, type ImageCropSettings } from "@/lib/imageCrop";

// ─── Types ────────────────────────────────────────────────────────────────────

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_crop_settings: Record<string, unknown> | null;
  primary_button_text: string | null;
  primary_button_url: string | null;
  secondary_button_text: string | null;
  secondary_button_url: string | null;
  right_items: unknown[];
  sort_order: number;
  is_active: boolean;
  settings: Record<string, unknown>;
};

type FormData = {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  image_alt: string;
  image_crop_settings: ImageCropSettings;
  primary_button_text: string;
  primary_button_url: string;
  secondary_button_text: string;
  secondary_button_url: string;
  right_items: string[];
  sort_order: number;
  is_active: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  showDescription: boolean;
  showRightItems: boolean;
  showPrimaryButton: boolean;
  showSecondaryButton: boolean;
  textPosition: string;
  verticalPosition: string;
  textAlign: string;
  imagePosition: string;
  overlayColor: string;
  overlayOpacity: number;
  gradientDirection: string;
  slideDuration: number;
  titleSize: string;
  contentMaxWidth: string;
};

const DEFAULT_FORM: FormData = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  image_alt: "",
  image_crop_settings: getDefaultImageCrop({ frameShape: "banner", aspectPreset: "16:9" }),
  primary_button_text: "",
  primary_button_url: "",
  secondary_button_text: "",
  secondary_button_url: "",
  right_items: [""],
  sort_order: 0,
  is_active: true,
  showTitle: true,
  showSubtitle: true,
  showDescription: true,
  showRightItems: true,
  showPrimaryButton: true,
  showSecondaryButton: true,
  textPosition: "left",
  verticalPosition: "center",
  textAlign: "left",
  imagePosition: "center",
  overlayColor: "#000000",
  overlayOpacity: 0.55,
  gradientDirection: "to right",
  slideDuration: 5000,
  titleSize: "large",
  contentMaxWidth: "xl",
};

function slideToForm(slide: Slide): FormData {
  const s = slide.settings ?? {};
  const rightItems = Array.isArray(slide.right_items)
    ? slide.right_items
        .map((item) => (typeof item === "string" ? item : String(item ?? "")))
        .filter((item) => item.trim().length > 0)
    : [];

  return {
    title: slide.title,
    subtitle: slide.subtitle ?? "",
    description: slide.description ?? "",
    image_url: slide.image_url ?? "",
    image_alt: slide.image_alt ?? "",
    image_crop_settings: cropToJson(slide.image_crop_settings),
    primary_button_text: slide.primary_button_text ?? "",
    primary_button_url: slide.primary_button_url ?? "",
    secondary_button_text: slide.secondary_button_text ?? "",
    secondary_button_url: slide.secondary_button_url ?? "",
    right_items: rightItems.length > 0 ? rightItems : [""],
    sort_order: slide.sort_order ?? 0,
    is_active: slide.is_active ?? true,
    showTitle: typeof s.showTitle === "boolean" ? s.showTitle : true,
    showSubtitle: typeof s.showSubtitle === "boolean" ? s.showSubtitle : true,
    showDescription: typeof s.showDescription === "boolean" ? s.showDescription : true,
    showRightItems: typeof s.showRightItems === "boolean" ? s.showRightItems : true,
    showPrimaryButton: typeof s.showPrimaryButton === "boolean" ? s.showPrimaryButton : true,
    showSecondaryButton: typeof s.showSecondaryButton === "boolean" ? s.showSecondaryButton : true,
    textPosition: (s.textPosition as string) ?? "left",
    verticalPosition: (s.verticalPosition as string) ?? "center",
    textAlign: (s.textAlign as string) ?? "left",
    imagePosition: (s.imagePosition as string) ?? "center",
    overlayColor: (s.overlayColor as string) ?? "#000000",
    overlayOpacity: typeof s.overlayOpacity === "number" ? s.overlayOpacity : 0.55,
    gradientDirection: (s.gradientDirection as string) ?? "to right",
    slideDuration: typeof s.slideDuration === "number" ? s.slideDuration : 5000,
    titleSize: (s.titleSize as string) ?? "large",
    contentMaxWidth: (s.contentMaxWidth as string) ?? "xl",
  };
}

function formToPayload(f: FormData) {
  const right_items = f.right_items
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: f.title.trim() || "สไลด์ไม่มีชื่อ",
    subtitle: f.subtitle.trim() || null,
    description: f.description.trim() || null,
    image_url: f.image_url.trim() || null,
    image_alt: f.image_alt.trim() || null,
    image_crop_settings: cropToJson(f.image_crop_settings),
    primary_button_text: f.primary_button_text.trim() || null,
    primary_button_url: f.primary_button_url.trim() || null,
    secondary_button_text: f.secondary_button_text.trim() || null,
    secondary_button_url: f.secondary_button_url.trim() || null,
    right_items,
    sort_order: f.sort_order,
    is_active: f.is_active,
    settings: {
      showTitle: f.showTitle && !!f.title.trim(),
      showSubtitle: f.showSubtitle && !!f.subtitle.trim(),
      showDescription: f.showDescription && !!f.description.trim(),
      showRightItems: f.showRightItems && right_items.length > 0,
      showPrimaryButton: f.showPrimaryButton && !!f.primary_button_text.trim() && !!f.primary_button_url.trim(),
      showSecondaryButton: f.showSecondaryButton && !!f.secondary_button_text.trim() && !!f.secondary_button_url.trim(),
      textPosition: f.textPosition,
      verticalPosition: f.verticalPosition,
      textAlign: f.textAlign,
      imagePosition: f.imagePosition,
      overlayColor: f.overlayColor,
      overlayOpacity: f.overlayOpacity,
      gradientDirection: f.gradientDirection,
      slideDuration: f.slideDuration,
      titleSize: f.titleSize,
      contentMaxWidth: f.contentMaxWidth,
    },
  };
}


function getOrderOptions(slides: Slide[], currentSlideId?: string) {
  const usedOrders = new Set(
    slides
      .filter((s) => s.id !== currentSlideId)
      .map((s) => Number(s.sort_order))
      .filter((n) => Number.isFinite(n) && n > 0)
  );

  const currentOrder = slides.find((s) => s.id === currentSlideId)?.sort_order;
  const max = Math.max(slides.length + (currentSlideId ? 0 : 1), Number(currentOrder ?? 0), 1);

  const options: { value: number; label: string; disabled: boolean }[] = [];
  for (let order = 1; order <= max; order += 1) {
    const locked = usedOrders.has(order);
    options.push({
      value: order,
      label: locked ? `ลำดับ ${order} — ถูกใช้แล้ว` : `ลำดับ ${order}`,
      disabled: locked,
    });
  }

  return options;
}

function getFirstAvailableOrder(slides: Slide[]) {
  const usedOrders = new Set(
    slides
      .map((s) => Number(s.sort_order))
      .filter((n) => Number.isFinite(n) && n > 0)
  );

  for (let order = 1; order <= slides.length + 1; order += 1) {
    if (!usedOrders.has(order)) return order;
  }

  return slides.length + 1;
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function FL({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600 mb-1">{children}</label>;
}

function FInput({
  value, onChange, placeholder = "", type = "text",
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-lg px-3 h-9 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 transition bg-white"
    />
  );
}

function FSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 h-9 text-sm focus:outline-none focus:border-brand-400 bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function FToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none",
          checked ? "bg-orange-500" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function Toast({ toast, onClose }: { toast: { type: "success" | "error"; message: string }; onClose: () => void }) {
  return (
    <div className={cn(
      "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg text-sm font-medium",
      toast.type === "success"
        ? "bg-white border-emerald-200 text-emerald-700"
        : "bg-white border-rose-200 text-rose-600"
    )}>
      {toast.type === "success"
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      {toast.message}
      <button onClick={onClose} className="ml-1 text-slate-400 hover:text-slate-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Slide Modal ──────────────────────────────────────────────────────────────

function SlideModal({
  open, slide, slides, onClose, onSave,
}: {
  open: boolean;
  slide: Slide | null;
  slides: Slide[];
  onClose: () => void;
  onSave: (payload: ReturnType<typeof formToPayload>, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [tab, setTab] = useState<"main" | "settings">("main");
  const [saving, setSaving] = useState(false);
  const orderOptions = getOrderOptions(slides, slide?.id);

  useEffect(() => {
    if (open) {
      setForm(slide ? slideToForm(slide) : { ...DEFAULT_FORM, sort_order: getFirstAvailableOrder(slides) });
      setTab("main");
    }
  }, [open, slide, slides]);

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    const selectedOrder = Number(form.sort_order);
    const selectedOption = orderOptions.find((option) => option.value === selectedOrder);

    if (!selectedOption || selectedOption.disabled) {
      setTab("main");
      return;
    }

    setSaving(true);
    try {
      await onSave(formToPayload(form), slide?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-10 pb-10">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {slide ? "แก้ไขสไลด์" : "เพิ่มสไลด์ใหม่"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {(["main", "settings"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium transition-colors",
                tab === t
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t === "main" ? "ข้อมูลหลัก" : "การแสดงผล"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === "main" && (
            <>
              {/* Image preview */}
              <div className="flex gap-3">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  {form.image_url ? (
                    <CroppedImage
                      src={form.image_url}
                      alt="preview"
                      crop={form.image_crop_settings}
                      className="h-full w-full rounded-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <CloudinaryImageUploader
                    value={form.image_url}
                    onChange={(url) => set("image_url", url)}
                    folder="hero-slides"
                    label="อัปโหลดรูปหน้าปก"
                  />
                  <FL>URL รูปภาพ</FL>
                  <FInput
                    value={form.image_url}
                    onChange={(v) => set("image_url", v)}
                    placeholder="/placeholders/hero-1.svg หรือ https://..."
                  />
                  {form.image_url && (
                    <ImageCropControls
                      imageUrl={form.image_url}
                      alt={form.image_alt || form.title || "hero slide"}
                      value={form.image_crop_settings}
                      onChange={(crop) => set("image_crop_settings", crop)}
                      frameShape="banner"
                      aspectPreset="16:9"
                    />
                  )}
                </div>
              </div>

              <div>
                <FL>ข้อความ Alt รูป</FL>
                <FInput value={form.image_alt} onChange={(v) => set("image_alt", v)} placeholder="คำอธิบายรูปภาพ" />
              </div>

              <div>
                <FL>หัวข้อ (title) </FL>
                <FInput value={form.title} onChange={(v) => set("title", v)} placeholder="หัวข้อสไลด์" />
                {/* {!form.title.trim() && <p className="text-xs text-rose-500 mt-1">กรุณากรอกหัวข้อ</p>} */}
              </div>

              <div>
                <FL>หัวข้อย่อย (subtitle)</FL>
                <FInput value={form.subtitle} onChange={(v) => set("subtitle", v)} placeholder="เช่น สาขาเทคโนโลยีสารสนเทศ" />
              </div>

              <div>
                <FL>คำอธิบาย (description)</FL>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="คำอธิบายสั้น ๆ สำหรับสไลด์นี้"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 transition bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FL>ปุ่มหลัก (ข้อความ)</FL>
                  <FInput value={form.primary_button_text} onChange={(v) => set("primary_button_text", v)} placeholder="เช่น ดูรายละเอียด" />
                </div>
                <div>
                  <FL>ปุ่มหลัก (URL)</FL>
                  <FInput value={form.primary_button_url} onChange={(v) => set("primary_button_url", v)} placeholder="/programs/bachelor" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FL>ปุ่มรอง (ข้อความ)</FL>
                  <FInput value={form.secondary_button_text} onChange={(v) => set("secondary_button_text", v)} placeholder="เช่น ติดต่อสอบถาม" />
                </div>
                <div>
                  <FL>ปุ่มรอง (URL)</FL>
                  <FInput value={form.secondary_button_url} onChange={(v) => set("secondary_button_url", v)} placeholder="/about/contact" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <FL>รายการด้านขวา (right_items)</FL>
                  <button
                    type="button"
                    onClick={() => set("right_items", [...form.right_items, ""])}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> เพิ่มรายการ
                  </button>
                </div>

                <div className="space-y-2">
                  {form.right_items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FInput
                        value={item}
                        onChange={(v) => {
                          const nextItems = [...form.right_items];
                          nextItems[index] = v;
                          set("right_items", nextItems);
                        }}
                        placeholder={`ข้อความรายการที่ ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextItems = form.right_items.filter((_, i) => i !== index);
                          set("right_items", nextItems.length > 0 ? nextItems : [""]);
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">กรอกเป็นข้อความทีละช่อง ระบบจะบันทึกเป็นรายการให้อัตโนมัติ</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FL>ลำดับ (ล็อกไม่ให้ชนกัน)</FL>
                  <select
                    value={form.sort_order}
                    onChange={(e) => set("sort_order", Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg px-3 h-9 text-sm focus:outline-none focus:border-brand-400 bg-white"
                  >
                    {orderOptions.map((option) => (
                      <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">ลำดับที่ถูกใช้แล้วจะเลือกไม่ได้ เพื่อกันสไลด์ชนลำดับกัน</p>
                </div>
                <div className="flex items-end pb-1">
                  <FToggle checked={form.is_active} onChange={(v) => set("is_active", v)} label="เปิดใช้งาน" />
                </div>
              </div>
            </>
          )}

          {tab === "settings" && (
            <>
              {/* Show/Hide */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">แสดง / ซ่อน</p>
                <div className="grid grid-cols-2 gap-2">
                  <FToggle checked={form.showTitle} onChange={(v) => set("showTitle", v)} label="แสดง Title" />
                  <FToggle checked={form.showSubtitle} onChange={(v) => set("showSubtitle", v)} label="แสดง Subtitle" />
                  <FToggle checked={form.showDescription} onChange={(v) => set("showDescription", v)} label="แสดง Description" />
                  <FToggle checked={form.showRightItems} onChange={(v) => set("showRightItems", v)} label="แสดง Right Items" />
                  <FToggle checked={form.showPrimaryButton} onChange={(v) => set("showPrimaryButton", v)} label="แสดงปุ่มหลัก" />
                  <FToggle checked={form.showSecondaryButton} onChange={(v) => set("showSecondaryButton", v)} label="แสดงปุ่มรอง" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ตำแหน่งข้อความ</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FL>แนวนอน (textPosition)</FL>
                    <FSelect
                      value={form.textPosition}
                      onChange={(v) => set("textPosition", v)}
                      options={[
                        { value: "left", label: "ซ้าย" },
                        { value: "center", label: "กลาง" },
                        { value: "right", label: "ขวา" },
                      ]}
                    />
                  </div>
                  <div>
                    <FL>แนวตั้ง (verticalPosition)</FL>
                    <FSelect
                      value={form.verticalPosition}
                      onChange={(v) => set("verticalPosition", v)}
                      options={[
                        { value: "top", label: "บน" },
                        { value: "center", label: "กลาง" },
                        { value: "bottom", label: "ล่าง" },
                      ]}
                    />
                  </div>
                  <div>
                    <FL>จัดตัวอักษร (textAlign)</FL>
                    <FSelect
                      value={form.textAlign}
                      onChange={(v) => set("textAlign", v)}
                      options={[
                        { value: "left", label: "ซ้าย" },
                        { value: "center", label: "กลาง" },
                        { value: "right", label: "ขวา" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">รูปภาพและ Overlay</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FL>ตำแหน่งรูป (imagePosition)</FL>
                    <FSelect
                      value={form.imagePosition}
                      onChange={(v) => set("imagePosition", v)}
                      options={[
                        { value: "center", label: "กลาง" },
                        { value: "top", label: "บน" },
                        { value: "bottom", label: "ล่าง" },
                        { value: "left", label: "ซ้าย" },
                        { value: "right", label: "ขวา" },
                      ]}
                    />
                  </div>
                  <div>
                    <FL>ทิศทาง Gradient</FL>
                    <FSelect
                      value={form.gradientDirection}
                      onChange={(v) => set("gradientDirection", v)}
                      options={[
                        { value: "to right", label: "ซ้าย → ขวา" },
                        { value: "to left", label: "ขวา → ซ้าย" },
                        { value: "to bottom", label: "บน → ล่าง" },
                        { value: "to top", label: "ล่าง → บน" },
                      ]}
                    />
                  </div>
                  <div>
                    <FL>สี Overlay</FL>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={form.overlayColor}
                        onChange={(e) => set("overlayColor", e.target.value)}
                        className="h-9 w-14 rounded-lg border border-slate-200 cursor-pointer p-1 bg-white"
                      />
                      <FInput
                        value={form.overlayColor}
                        onChange={(v) => set("overlayColor", v)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <FL>ความโปร่ง Overlay (0–1)</FL>
                    <div className="space-y-1">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={form.overlayOpacity}
                        onChange={(e) => set("overlayOpacity", parseFloat(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                      <div className="text-xs text-slate-500 text-right">{form.overlayOpacity.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">ขนาดและเวลา</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FL>ขนาด Title</FL>
                    <FSelect
                      value={form.titleSize}
                      onChange={(v) => set("titleSize", v)}
                      options={[
                        { value: "small", label: "เล็ก" },
                        { value: "medium", label: "กลาง" },
                        { value: "large", label: "ใหญ่" },
                        { value: "xl", label: "ใหญ่มาก" },
                      ]}
                    />
                  </div>
                  <div>
                    <FL>ความกว้างเนื้อหา</FL>
                    <FSelect
                      value={form.contentMaxWidth}
                      onChange={(v) => set("contentMaxWidth", v)}
                      options={[
                        { value: "md", label: "แคบ (md)" },
                        { value: "lg", label: "กลาง (lg)" },
                        { value: "xl", label: "กว้าง (xl)" },
                        { value: "2xl", label: "กว้างมาก (2xl)" },
                      ]}
                    />
                  </div>
                  <div>
                    <FL>เวลาต่อสไลด์ (ms)</FL>
                    <FInput
                      type="number"
                      value={form.slideDuration}
                      onChange={(v) => set("slideDuration", parseInt(v) || 5000)}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "กำลังบันทึก..." : slide ? "บันทึก" : "เพิ่มสไลด์"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HeroSlidesDashboard() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modalTarget, setModalTarget] = useState<Slide | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await heroSlidesApi.list();
      setSlides(data as Slide[]);
    } catch (err) {
      showToast("error", "โหลดข้อมูลไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  const handleSave = async (payload: ReturnType<typeof formToPayload>, id?: string) => {
    try {
      if (id) {
        await heroSlidesApi.update(id, payload);
        showToast("success", "บันทึกการแก้ไขเรียบร้อย");
      } else {
        await heroSlidesApi.create(payload);
        showToast("success", "เพิ่มสไลด์เรียบร้อย");
      }
      await loadSlides();
    } catch (err) {
      showToast(
        "error",
        "บันทึกสไลด์ไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err))
      );
      throw err;
    }
  };

  const handleToggleActive = async (slide: Slide) => {
    try {
      await heroSlidesApi.update(slide.id, { is_active: !slide.is_active });
      showToast("success", slide.is_active ? "ปิดใช้งานสไลด์แล้ว" : "เปิดใช้งานสไลด์แล้ว");
      await loadSlides();
    } catch {
      showToast("error", "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await heroSlidesApi.remove(deleteId);
      showToast("success", "ลบสไลด์เรียบร้อย");
      setDeleteId(null);
      await loadSlides();
    } catch {
      showToast("error", "ลบสไลด์ไม่สำเร็จ");
    }
  };
  const handleDuplicate = async (slide: Slide) => {
    const { id: _id, ...rest } = slide;
    try {
      await heroSlidesApi.create({
        ...rest,
        title: slide.title + " (สำเนา)",
        sort_order: getFirstAvailableOrder(slides),
        is_active: false,
      });
      showToast("success", "ทำสำเนาเรียบร้อย");
      await loadSlides();
    } catch {
      showToast("error", "ทำสำเนาไม่สำเร็จ");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <DashboardPageHeader
        title="สไลด์หน้าแรก"
        description={`ทั้งหมด ${slides.length} สไลด์ · ใช้งานอยู่ ${slides.filter((s) => s.is_active).length} สไลด์`}
        action={
          <button
            onClick={() => setModalTarget("new")}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-brand hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> เพิ่มสไลด์
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">กำลังโหลด...</span>
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <div className="text-slate-300 mb-3"><ImageOff className="w-10 h-10 mx-auto" /></div>
          <p className="text-sm text-slate-500 mb-4">ยังไม่มีสไลด์</p>
          <button
            onClick={() => setModalTarget("new")}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-brand"
          >
            <Plus className="w-4 h-4" /> เพิ่มสไลด์แรก
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...slides].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((slide) => (
            <div
              key={slide.id}
              className={cn(
                "bg-white border rounded-2xl overflow-hidden transition",
                slide.is_active ? "border-slate-100" : "border-slate-100 opacity-60"
              )}
            >
              <div className="flex gap-0">
                {/* Thumbnail */}
                <div className="w-28 sm:w-32 shrink-0 bg-slate-100">
                  {slide.image_url ? (
                    <CroppedImage
                      src={slide.image_url}
                      fallbackSrc="/placeholders/hero-1.svg"
                      alt={slide.image_alt || slide.title}
                      crop={slide.image_crop_settings}
                      className="h-24 w-full rounded-none"
                    />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center text-slate-300">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 px-4 py-3 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">
                      {slide.title}
                    </span>

                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border",
                        slide.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      {slide.is_active ? "เปิด" : "ปิด"}
                    </span>

                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                      ลำดับ {slide.sort_order}
                    </span>
                  </div>

                  {slide.subtitle && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {slide.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
<div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-slate-100 bg-slate-50/70">


  <button
    onClick={() => handleDuplicate(slide)}
     className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition"
    title="ทำสำเนา"
  >
    <Copy className="w-4 h-4" />
  </button>

<button
  onClick={() => handleToggleActive(slide)}
  className={
    slide.is_active !== false
      ? "p-2 rounded-lg text-emerald-600 hover:bg-amber-50 hover:text-amber-600 transition"
      : "p-2 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
  }
  title={slide.is_active !== false ? "ปิดใช้งานสไลด์" : "เปิดใช้งานสไลด์"}
>
  {slide.is_active !== false ? (
    <Eye className="w-4 h-4" />
  ) : (
    <EyeOff className="w-4 h-4" />
  )}
</button>

  <button
    onClick={() => setModalTarget(slide)}
    className="p-2 rounded-lg text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition"
    title="แก้ไข"
  >
    <Pencil className="w-4 h-4" />
  </button>

  <button
    onClick={() => setDeleteId(slide.id)}
                         className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
    title="ลบสไลด์"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</div>
            </div>
          ))}
        </div>
      )}

      <SlideModal
        open={modalTarget !== null}
        slide={modalTarget === "new" ? null : modalTarget}
        slides={slides}
        onClose={() => setModalTarget(null)}
        onSave={handleSave}
      />

      <ConfirmModal
        open={!!deleteId}
        title="ลบสไลด์นี้?"
        description="เมื่อลบแล้ว ข้อมูลสไลด์นี้จะถูกลบออกจากระบบและไม่สามารถกู้คืนจากหน้านี้ได้"
        variant="danger"
        confirmLabel="ลบสไลด์"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
