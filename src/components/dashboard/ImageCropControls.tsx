"use client";

import { Scissors, RotateCcw } from "lucide-react";
import {
  cropToJson,
  getDefaultImageCrop,
  normalizeImageCrop,
  type ImageCropSettings,
} from "@/lib/imageCrop";
import CroppedImage from "@/components/ui/CroppedImage";

type Props = {
  imageUrl?: string | null;
  alt?: string;
  value?: ImageCropSettings | Record<string, unknown> | null;
  onChange: (value: ImageCropSettings) => void;
  frameShape?: ImageCropSettings["frameShape"];
  aspectPreset?: string;
  previewClassName?: string;
};

export default function ImageCropControls({
  imageUrl,
  alt = "preview",
  value,
  onChange,
  frameShape = "rounded",
  aspectPreset = "16:9",
  previewClassName = "aspect-video w-full",
}: Props) {
  const crop = normalizeImageCrop({ ...value, frameShape: value?.frameShape ?? frameShape, aspectPreset: value?.aspectPreset ?? aspectPreset });
  const set = (patch: Partial<ImageCropSettings>) => onChange(cropToJson({ ...crop, ...patch }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Scissors className="h-4 w-4 text-brand-600" />
          ปรับรูป / ตัดรูป
        </div>
        <button
          type="button"
          onClick={() => onChange(getDefaultImageCrop({ frameShape, aspectPreset }))}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          รีเซ็ต
        </button>
      </div>

      <CroppedImage
        src={imageUrl}
        alt={alt}
        crop={crop}
        className={`${previewClassName} border border-slate-200 bg-white`}
      />

      <div>
        <div className="mb-1.5 text-xs font-medium text-slate-600">การแสดงรูป</div>
        <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white">
          {(["cover", "contain"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set({ fitMode: mode })}
              className={`px-3 py-2 text-xs font-medium ${crop.fitMode === mode ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {mode === "cover" ? "เต็มกรอบ (Cover)" : "แสดงครบ (Contain)"}
            </button>
          ))}
        </div>
      </div>

      <Slider label={`ตำแหน่ง X (${crop.posX}%)`} min={0} max={100} value={crop.posX} onChange={(v) => set({ posX: v })} />
      <Slider label={`ตำแหน่ง Y (${crop.posY}%)`} min={0} max={100} value={crop.posY} onChange={(v) => set({ posY: v })} />
      <Slider label={`Zoom (${crop.zoom.toFixed(1)}x)`} min={100} max={300} value={Math.round(crop.zoom * 100)} onChange={(v) => set({ zoom: v / 100 })} />
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer rounded-full bg-slate-200 accent-brand-500"
      />
    </div>
  );
}
