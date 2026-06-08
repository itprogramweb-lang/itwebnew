"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { heroSlidesApi } from "@/frontend/api/heroSlides";
import CloudinaryImageUploader from "@/components/dashboard/CloudinaryImageUploader";
import ImageCropControls from "@/components/dashboard/ImageCropControls";
import CroppedImage from "@/components/ui/CroppedImage";
import { cn } from "@/lib/utils";
import { DashboardPageHeader } from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Button from "@/components/ui/Button";
import {
  cropToJson,
  getDefaultImageCrop,
  type ImageCropSettings,
} from "@/lib/imageCrop";

// ─── Types ────────────────────────────────────────────────────────────────────

type SlideSettings = {
  showTitle?: boolean;
  showSubtitle?: boolean;
  showDescription?: boolean;
  showRightItems?: boolean;
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;

  textPosition?: string;
  verticalPosition?: string;
  textAlign?: string;
  imagePosition?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  gradientDirection?: string;
  slideDuration?: number;
  titleSize?: string;
  contentMaxWidth?: string;
};

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
  sort_order: number | null;
  is_active: boolean;
  settings: SlideSettings | null;
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
  sort_order: number | null;
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
  image_crop_settings: getDefaultImageCrop({
    frameShape: "banner",
    aspectPreset: "16:9",
  }),
  primary_button_text: "",
  primary_button_url: "",
  secondary_button_text: "",
  secondary_button_url: "",
  right_items: [""],
  sort_order: null,
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
  gradientDirection: "to top",
  slideDuration: 5000,
  titleSize: "large",
  contentMaxWidth: "xl",
};

function slideToForm(slide: Slide): FormData {
  const settings = slide.settings ?? {};

  const rightItems = Array.isArray(slide.right_items)
    ? slide.right_items
        .map((item) => (typeof item === "string" ? item : String(item ?? "")))
        .filter((item) => item.trim().length > 0)
    : [];

  return {
    title: slide.title ?? "",
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
    sort_order: slide.sort_order ?? null,
    is_active: slide.is_active ?? true,

    showTitle:
      typeof settings.showTitle === "boolean" ? settings.showTitle : true,
    showSubtitle:
      typeof settings.showSubtitle === "boolean" ? settings.showSubtitle : true,
    showDescription:
      typeof settings.showDescription === "boolean"
        ? settings.showDescription
        : true,
    showRightItems:
      typeof settings.showRightItems === "boolean"
        ? settings.showRightItems
        : true,
    showPrimaryButton:
      typeof settings.showPrimaryButton === "boolean"
        ? settings.showPrimaryButton
        : true,
    showSecondaryButton:
      typeof settings.showSecondaryButton === "boolean"
        ? settings.showSecondaryButton
        : true,

    textPosition:
      typeof settings.textPosition === "string"
        ? settings.textPosition
        : "left",
    verticalPosition:
      typeof settings.verticalPosition === "string"
        ? settings.verticalPosition
        : "center",
    textAlign:
      typeof settings.textAlign === "string" ? settings.textAlign : "left",
    imagePosition:
      typeof settings.imagePosition === "string"
        ? settings.imagePosition
        : "center",
    overlayColor:
      typeof settings.overlayColor === "string"
        ? settings.overlayColor
        : "#000000",
    overlayOpacity:
      typeof settings.overlayOpacity === "number"
        ? settings.overlayOpacity
        : 0.55,
    gradientDirection:
      typeof settings.gradientDirection === "string"
        ? settings.gradientDirection
        : "to top",
    slideDuration:
      typeof settings.slideDuration === "number"
        ? settings.slideDuration
        : 5000,
    titleSize:
      typeof settings.titleSize === "string" ? settings.titleSize : "large",
    contentMaxWidth:
      typeof settings.contentMaxWidth === "string"
        ? settings.contentMaxWidth
        : "xl",
  };
}

function formToPayload(form: FormData) {
  const rightItems = form.right_items
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title: form.title.trim() || "สไลด์ไม่มีชื่อ",
    subtitle: form.subtitle.trim() || null,
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    image_alt: form.image_alt.trim() || null,
    image_crop_settings: cropToJson(form.image_crop_settings),
    primary_button_text: form.primary_button_text.trim() || null,
    primary_button_url: form.primary_button_url.trim() || null,
    secondary_button_text: form.secondary_button_text.trim() || null,
    secondary_button_url: form.secondary_button_url.trim() || null,
    right_items: rightItems,
    sort_order: form.sort_order,
    is_active: form.is_active,
    settings: {
      showTitle: form.showTitle && !!form.title.trim(),
      showSubtitle: form.showSubtitle && !!form.subtitle.trim(),
      showDescription: form.showDescription && !!form.description.trim(),
      showRightItems: form.showRightItems && rightItems.length > 0,
      showPrimaryButton:
        form.showPrimaryButton &&
        !!form.primary_button_text.trim() &&
        !!form.primary_button_url.trim(),
      showSecondaryButton:
        form.showSecondaryButton &&
        !!form.secondary_button_text.trim() &&
        !!form.secondary_button_url.trim(),

      textPosition: form.textPosition,
      verticalPosition: form.verticalPosition,
      textAlign: form.textAlign,
      imagePosition: form.imagePosition,
      overlayColor: form.overlayColor,
      overlayOpacity: form.overlayOpacity,
      gradientDirection: form.gradientDirection,
      slideDuration: form.slideDuration,
      titleSize: form.titleSize,
      contentMaxWidth: form.contentMaxWidth,
    },
  };
}

type SlidePayload = ReturnType<typeof formToPayload>;

// ─── Order helpers ────────────────────────────────────────────────────────────

function getOrderOptions(slides: Slide[], currentSlideId?: string) {
  const currentOrder = slides.find((slide) => slide.id === currentSlideId)
    ?.sort_order;

  const max = currentSlideId
    ? Math.max(slides.length, Number(currentOrder ?? 0), 1)
    : Math.max(slides.length + 1, 1);

  const options: { value: string; label: string }[] = [
    { value: "", label: "ไม่มีลำดับ (ล่างสุด)" },
  ];

  for (let order = 1; order <= max; order += 1) {
    options.push({
      value: String(order),
      label: `ลำดับ ${order}`,
    });
  }

  return options;
}

function getFirstAvailableOrder(slides: Slide[]) {
  const usedOrders = new Set(
    slides
      .map((slide) => Number(slide.sort_order))
      .filter((order) => Number.isFinite(order) && order > 0)
  );

  for (let order = 1; order <= slides.length + 1; order += 1) {
    if (!usedOrders.has(order)) return order;
  }

  return slides.length + 1;
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function FL({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-semibold text-slate-600">
      {children}
    </label>
  );
}

function FInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
}: {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100"
    />
  );
}

function FSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function FToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2.5">
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

function Toast({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error"; message: string };
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-5 right-5 z-[100] flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-lg",
        toast.type === "success"
          ? "border-emerald-200 text-emerald-700"
          : "border-rose-200 text-rose-600"
      )}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}

      <span>{toast.message}</span>

      <button
        type="button"
        onClick={onClose}
        className="ml-1 text-slate-400 hover:text-slate-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Slide Modal ──────────────────────────────────────────────────────────────

function SlideModal({
  open,
  slide,
  slides,
  onClose,
  onSave,
}: {
  open: boolean;
  slide: Slide | null;
  slides: Slide[];
  onClose: () => void;
  onSave: (payload: SlidePayload, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [tab, setTab] = useState<"main" | "settings">("main");
  const [saving, setSaving] = useState(false);

  const orderOptions = getOrderOptions(slides, slide?.id);

  useEffect(() => {
    if (!open) return;

    if (slide) {
      setForm(slideToForm(slide));
    } else {
      setForm({
        ...DEFAULT_FORM,
        sort_order: getFirstAvailableOrder(slides),
      });
    }

    setTab("main");
  }, [open, slide, slides]);

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);

    try {
      await onSave(formToPayload(form), slide?.id);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pb-10 pt-10">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            {slide ? "แก้ไขสไลด์" : "เพิ่มสไลด์ใหม่"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          {(["main", "settings"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium transition-colors",
                tab === item
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {item === "main" ? "ข้อมูลหลัก" : "การแสดงผล"}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {tab === "main" && (
            <>
              <div className="flex gap-3">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {form.image_url ? (
                    <CroppedImage
                      src={form.image_url}
                      alt="preview"
                      crop={form.image_crop_settings}
                      className="h-full w-full rounded-none"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <ImageOff className="h-6 w-6" />
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
                    onChange={(value) => set("image_url", value)}
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
                <FInput
                  value={form.image_alt}
                  onChange={(value) => set("image_alt", value)}
                  placeholder="คำอธิบายรูปภาพ"
                />
              </div>

              <div>
                <FL>หัวข้อ (title)</FL>
                <FInput
                  value={form.title}
                  onChange={(value) => set("title", value)}
                  placeholder="หัวข้อสไลด์"
                />
              </div>

              <div>
                <FL>หัวข้อย่อย (subtitle)</FL>
                <FInput
                  value={form.subtitle}
                  onChange={(value) => set("subtitle", value)}
                  placeholder="เช่น สาขาเทคโนโลยีสารสนเทศ"
                />
              </div>

              <div>
                <FL>คำอธิบาย (description)</FL>
                <textarea
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  rows={3}
                  placeholder="คำอธิบายสั้น ๆ สำหรับสไลด์นี้"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition focus:border-brand-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <FL>ปุ่มหลัก (ข้อความ)</FL>
                  <FInput
                    value={form.primary_button_text}
                    onChange={(value) => set("primary_button_text", value)}
                    placeholder="เช่น ดูรายละเอียด"
                  />
                </div>

                <div>
                  <FL>ปุ่มหลัก (URL)</FL>
                  <FInput
                    value={form.primary_button_url}
                    onChange={(value) => set("primary_button_url", value)}
                    placeholder="/programs/bachelor"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <FL>ปุ่มรอง (ข้อความ)</FL>
                  <FInput
                    value={form.secondary_button_text}
                    onChange={(value) => set("secondary_button_text", value)}
                    placeholder="เช่น ติดต่อสอบถาม"
                  />
                </div>

                <div>
                  <FL>ปุ่มรอง (URL)</FL>
                  <FInput
                    value={form.secondary_button_url}
                    onChange={(value) => set("secondary_button_url", value)}
                    placeholder="/about/contact"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <FL>รายการด้านขวา (right_items)</FL>

                  <button
                    type="button"
                    onClick={() =>
                      set("right_items", [...form.right_items, ""])
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    เพิ่มรายการ
                  </button>
                </div>

                <div className="space-y-2">
                  {form.right_items.map((item, index) => (
                    <div key={`${index}-${item}`} className="flex items-center gap-2">
                      <FInput
                        value={item}
                        onChange={(value) => {
                          const nextItems = [...form.right_items];
                          nextItems[index] = value;
                          set("right_items", nextItems);
                        }}
                        placeholder={`ข้อความรายการที่ ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const nextItems = form.right_items.filter(
                            (_, itemIndex) => itemIndex !== index
                          );

                          set(
                            "right_items",
                            nextItems.length > 0 ? nextItems : [""]
                          );
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-1 text-[11px] text-slate-400">
                  กรอกเป็นข้อความทีละช่อง ระบบจะบันทึกเป็นรายการให้อัตโนมัติ
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <FL>ลำดับ</FL>

                  <select
                    value={
                      form.sort_order === null ? "" : String(form.sort_order)
                    }
                    onChange={(event) =>
                      set(
                        "sort_order",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value)
                      )
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-brand-400 focus:outline-none"
                  >
                    {orderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                 <p className="mt-1 text-[11px] text-slate-400">
  &quot;ไม่มีลำดับ&quot; จะแสดงท้ายสุด · ถ้าเลือกตำแหน่งที่มีสไลด์อื่นอยู่
  ระบบจะเลื่อนถัดไปลงให้อัตโนมัติ
</p>
                </div>

                <div className="flex items-end pb-1">
                  <FToggle
                    checked={form.is_active}
                    onChange={(value) => set("is_active", value)}
                    label="เปิดใช้งาน"
                  />
                </div>
              </div>
            </>
          )}

          {tab === "settings" && (
            <>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  แสดง / ซ่อน
                </p>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <FToggle
                    checked={form.showTitle}
                    onChange={(value) => set("showTitle", value)}
                    label="แสดง Title"
                  />
                  <FToggle
                    checked={form.showSubtitle}
                    onChange={(value) => set("showSubtitle", value)}
                    label="แสดง Subtitle"
                  />
                  <FToggle
                    checked={form.showDescription}
                    onChange={(value) => set("showDescription", value)}
                    label="แสดง Description"
                  />
                  <FToggle
                    checked={form.showRightItems}
                    onChange={(value) => set("showRightItems", value)}
                    label="แสดง Right Items"
                  />
                  <FToggle
                    checked={form.showPrimaryButton}
                    onChange={(value) => set("showPrimaryButton", value)}
                    label="แสดงปุ่มหลัก"
                  />
                  <FToggle
                    checked={form.showSecondaryButton}
                    onChange={(value) => set("showSecondaryButton", value)}
                    label="แสดงปุ่มรอง"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  ตำแหน่งข้อความ
                </p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <FL>แนวนอน (textPosition)</FL>
                    <FSelect
                      value={form.textPosition}
                      onChange={(value) => set("textPosition", value)}
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
                      onChange={(value) => set("verticalPosition", value)}
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
                      onChange={(value) => set("textAlign", value)}
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
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  รูปภาพและ Overlay
                </p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <FL>ตำแหน่งรูป (imagePosition)</FL>
                    <FSelect
                      value={form.imagePosition}
                      onChange={(value) => set("imagePosition", value)}
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
                      onChange={(value) => set("gradientDirection", value)}
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
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.overlayColor}
                        onChange={(event) =>
                          set("overlayColor", event.target.value)
                        }
                        className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                      />

                      <FInput
                        value={form.overlayColor}
                        onChange={(value) => set("overlayColor", value)}
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
                        onChange={(event) =>
                          set("overlayOpacity", Number(event.target.value))
                        }
                        className="w-full accent-orange-500"
                      />

                      <div className="text-right text-xs text-slate-500">
                        {form.overlayOpacity.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  ขนาดและเวลา
                </p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <FL>ขนาด Title</FL>
                    <FSelect
                      value={form.titleSize}
                      onChange={(value) => set("titleSize", value)}
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
                      onChange={(value) => set("contentMaxWidth", value)}
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
                      onChange={(value) =>
                        set("slideDuration", Number.parseInt(value, 10) || 5000)
                      }
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
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
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalTarget, setModalTarget] = useState<Slide | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      window.setTimeout(() => setToast(null), 3500);
    },
    []
  );

  const loadSlides = useCallback(async () => {
    setLoading(true);

    try {
      const data = await heroSlidesApi.list();
      setSlides(data as Slide[]);
    } catch (error) {
      showToast(
        "error",
        `โหลดข้อมูลไม่สำเร็จ: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const handleSave = async (payload: SlidePayload, id?: string) => {
    try {
      if (id) {
        await heroSlidesApi.update(id, payload);
        showToast("success", "บันทึกการแก้ไขเรียบร้อย");
      } else {
        await heroSlidesApi.create(payload);
        showToast("success", "เพิ่มสไลด์เรียบร้อย");
      }

      await loadSlides();
    } catch (error) {
      showToast(
        "error",
        `บันทึกสไลด์ไม่สำเร็จ: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  const handleToggleActive = async (slide: Slide) => {
    try {
      await heroSlidesApi.update(slide.id, {
        is_active: !slide.is_active,
      });

      showToast(
        "success",
        slide.is_active ? "ปิดใช้งานสไลด์แล้ว" : "เปิดใช้งานสไลด์แล้ว"
      );

      await loadSlides();
    } catch {
      showToast("error", "เปลี่ยนสถานะไม่สำเร็จ");
    }
  };

  const handleOrderChange = async (
    slideId: string,
    newOrder: number | null
  ) => {
    setUpdatingOrderId(slideId);

    try {
      await heroSlidesApi.update(slideId, {
        sort_order: newOrder,
      });

      showToast(
        "success",
        newOrder === null
          ? "ย้ายสไลด์ไปล่างสุดแล้ว"
          : "อัปเดตลำดับสไลด์เรียบร้อย"
      );

      await loadSlides();
    } catch {
      showToast("error", "เปลี่ยนลำดับไม่สำเร็จ");
    } finally {
      setUpdatingOrderId(null);
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
    try {
      await heroSlidesApi.create({
        title: `${slide.title} (สำเนา)`,
        subtitle: slide.subtitle,
        description: slide.description,
        image_url: slide.image_url,
        image_alt: slide.image_alt,
        image_crop_settings: cropToJson(slide.image_crop_settings),
        primary_button_text: slide.primary_button_text,
        primary_button_url: slide.primary_button_url,
        secondary_button_text: slide.secondary_button_text,
        secondary_button_url: slide.secondary_button_url,
        right_items: Array.isArray(slide.right_items) ? slide.right_items : [],
        sort_order: getFirstAvailableOrder(slides),
        is_active: false,
        settings: slide.settings ?? {},
      });

      showToast("success", "ทำสำเนาเรียบร้อย");
      await loadSlides();
    } catch {
      showToast("error", "ทำสำเนาไม่สำเร็จ");
    }
  };

  const sortedSlides = [...slides].sort((a, b) => {
    if (a.sort_order === null && b.sort_order === null) return 0;
    if (a.sort_order === null) return 1;
    if (b.sort_order === null) return -1;

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return (
    <div className="mx-auto max-w-5xl">
      <DashboardPageHeader
        title="สไลด์หน้าแรก"
        description={`ทั้งหมด ${slides.length} สไลด์ · ใช้งานอยู่ ${
          slides.filter((slide) => slide.is_active).length
        } สไลด์`}
        action={
          <button
            type="button"
            onClick={() => setModalTarget("new")}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-brand transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสไลด์
          </button>
        }
      />

      {loading && slides.length === 0 ? (
        <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">กำลังโหลด...</span>
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <div className="mb-3 text-slate-300">
            <ImageOff className="mx-auto h-10 w-10" />
          </div>

          <p className="mb-4 text-sm text-slate-500">ยังไม่มีสไลด์</p>

          <button
            type="button"
            onClick={() => setModalTarget("new")}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white shadow-brand"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสไลด์แรก
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedSlides.map((slide) => {
            const orderOptions = getOrderOptions(slides, slide.id);
            const isNoOrder = slide.sort_order === null;

            return (
<div
  key={slide.id}
  className={cn(
    "h-[112px] overflow-hidden rounded-2xl border bg-white transition-all",
    slide.is_active
      ? "border-slate-200"
      : "border-slate-200 opacity-60"
  )}
>
               <div className="flex h-full items-stretch gap-0">
                 <div className="relative h-full w-[180px] shrink-0 bg-slate-100">
                    {slide.image_url ? (
                  <CroppedImage
  src={slide.image_url}
  fallbackSrc="/placeholders/hero-1.svg"
  alt={slide.image_alt || slide.title}
  crop={slide.image_crop_settings}
  className="h-full w-full rounded-none object-cover"
/>
                    ) : (
                     <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}

                    <span
                      className={cn(
                        "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                        slide.is_active
                          ? "bg-emerald-500/90 text-white"
                          : "bg-slate-500/80 text-white"
                      )}
                    >
                      {slide.is_active ? "เปิด" : "ปิด"}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {slide.title}
                      </span>

                      {isNoOrder && (
                        <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          ล่างสุด
                        </span>
                      )}
                    </div>

                    {slide.subtitle && (
                      <p className="truncate text-xs text-slate-500">
                        {slide.subtitle}
                      </p>
                    )}

                    {slide.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                        {slide.description}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                        {slide.sort_order !== null
                          ? `ลำดับ ${slide.sort_order}`
                          : "ไม่มีลำดับ"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 border-l border-slate-100 px-3">
                    <div className="relative">
                      <select
                        disabled={updatingOrderId === slide.id}
                        value={
                          slide.sort_order === null
                            ? ""
                            : String(slide.sort_order)
                        }
                        onChange={(event) =>
                          handleOrderChange(
                            slide.id,
                            event.target.value === ""
                              ? null
                              : Number(event.target.value)
                          )
                        }
                        className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 py-0 pl-2.5 pr-7 text-xs font-medium text-slate-600 transition focus:border-brand-400 focus:outline-none disabled:opacity-50"
                      >
                        {orderOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                        {updatingOrderId === slide.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(slide)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-purple-50 hover:text-purple-600"
                      title="ทำสำเนา"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(slide)}
                      className={cn(
                        "rounded-lg p-2 transition",
                        slide.is_active
                          ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                          : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                      )}
                      title={slide.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    >
                      {slide.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalTarget(slide)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                      title="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteId(slide.id)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="ลบสไลด์"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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