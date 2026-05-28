"use client";
import { RotateCcw } from "lucide-react";
import { buildLogoStyle, getPresetById } from "@/lib/logoPresets";

type CropValues = {
  fitMode: string;
  posX: number;
  posY: number;
  zoom: number;
};

type Props = {
  logoUrl?: string;
  brandShortName?: string;
  preset: string;
  values: CropValues;
  onChange: (v: Partial<CropValues>) => void;
  onResetToPreset: () => void;
};

const PREVIEW_SIZE = 160;

export default function LogoCropEditor({
  logoUrl,
  brandShortName = "CT",
  preset,
  values,
  onChange,
  onResetToPreset,
}: Props) {
  const { fitMode, posX, posY, zoom } = values;
  const isCover = fitMode === "cover";
  const p = getPresetById(preset);

  const { wrapperStyle, imgStyle } = buildLogoStyle({
    size: PREVIEW_SIZE,
    preset,
    fitMode,
    posX,
    posY,
    zoom,
  });

  return (
    <div className="space-y-4">
      {/* Fit mode toggle */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">การแสดงรูป</label>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => onChange({ fitMode: "contain" })}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !isCover
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            แสดงครบรูป (Contain)
          </button>
          <button
            type="button"
            onClick={() => onChange({ fitMode: "cover" })}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              isCover
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            เต็มกรอบ (Cover)
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {isCover
            ? "รูปจะเต็มกรอบ สามารถปรับตำแหน่งโฟกัสได้"
            : "แสดงรูปทั้งหมด ไม่ตัดส่วนใด"}
        </p>
      </div>

      {/* Preview + focal point */}
      <div className="flex gap-6 items-start flex-wrap">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">Preview ขนาดจริง</label>
          <div
            style={{
              ...wrapperStyle,
              backgroundImage:
                "repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 0 0 / 12px 12px",
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" style={imgStyle} />
            ) : (
              <div
                style={wrapperStyle}
                className="bg-brand-gradient grid place-items-center"
              >
                <span className="text-white font-bold text-lg select-none">
                  {brandShortName.slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 text-center">
            {PREVIEW_SIZE}×{PREVIEW_SIZE}px · {p.borderRadius}
          </div>
        </div>

        {/* Sliders */}
        <div className="flex-1 min-w-[180px] space-y-3">
          <SliderField
            label={`ตำแหน่ง X (${posX}%)`}
            min={0}
            max={100}
            value={posX}
            onChange={(v) => onChange({ posX: v })}
            hint={posX < 30 ? "ชิดซ้าย" : posX > 70 ? "ชิดขวา" : "กลาง"}
          />
          <SliderField
            label={`ตำแหน่ง Y (${posY}%)`}
            min={0}
            max={100}
            value={posY}
            onChange={(v) => onChange({ posY: v })}
            hint={posY < 30 ? "ชิดบน" : posY > 70 ? "ชิดล่าง" : "กลาง"}
          />
          {isCover && (
            <SliderField
              label={`ซูม (${zoom.toFixed(1)}×)`}
              min={100}
              max={300}
              value={Math.round(zoom * 100)}
              onChange={(v) => onChange({ zoom: v / 100 })}
              hint={zoom <= 1.05 ? "ปกติ" : zoom >= 2.5 ? "ซูมมาก" : ""}
            />
          )}
        </div>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={onResetToPreset}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        รีเซ็ตตำแหน่งตาม template
      </button>
    </div>
  );
}

function SliderField({
  label,
  min,
  max,
  value,
  onChange,
  hint,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full accent-brand-500 cursor-pointer"
      />
    </div>
  );
}
