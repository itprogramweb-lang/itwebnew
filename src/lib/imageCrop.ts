import type { CSSProperties } from "react";

export type ImageFitMode = "contain" | "cover";
export type ImageFrameShape = "square" | "rounded" | "circle" | "wide" | "banner" | "card";

export type ImageCropSettings = {
  fitMode?: ImageFitMode;
  posX?: number;
  posY?: number;
  zoom?: number;
  aspectPreset?: string;
  frameShape?: ImageFrameShape;
};

export const DEFAULT_IMAGE_CROP: Required<ImageCropSettings> = {
  fitMode: "cover",
  posX: 50,
  posY: 50,
  zoom: 1,
  aspectPreset: "16:9",
  frameShape: "rounded",
};

export function normalizeImageCrop(raw?: ImageCropSettings | Record<string, unknown> | null): Required<ImageCropSettings> {
  const fitMode = raw?.fitMode === "contain" ? "contain" : "cover";
  const posX = clampNumber(raw?.posX, 0, 100, 50);
  const posY = clampNumber(raw?.posY, 0, 100, 50);
  const zoom = clampNumber(raw?.zoom, 1, 3, 1);
  const aspectPreset = typeof raw?.aspectPreset === "string" && raw.aspectPreset ? raw.aspectPreset : "16:9";
  const frameShape = isFrameShape(raw?.frameShape) ? raw.frameShape : "rounded";
  return { fitMode, posX, posY, zoom, aspectPreset, frameShape };
}

export function getDefaultImageCrop(partial?: Partial<ImageCropSettings>): Required<ImageCropSettings> {
  return normalizeImageCrop({ ...DEFAULT_IMAGE_CROP, ...partial });
}

export function buildImageCropStyle(raw?: ImageCropSettings | Record<string, unknown> | null): {
  wrapperStyle: CSSProperties;
  imgStyle: CSSProperties;
} {
  const crop = normalizeImageCrop(raw);
  const z = crop.fitMode === "cover" ? crop.zoom : 1;
  return {
    wrapperStyle: {
      overflow: "hidden",
      backgroundColor: "#f1f5f9",
    },
    imgStyle: {
      width: "100%",
      height: "100%",
      objectFit: crop.fitMode,
      objectPosition: `${crop.posX}% ${crop.posY}%`,
      transform: z > 1.001 ? `scale(${z})` : undefined,
      transformOrigin: `${crop.posX}% ${crop.posY}%`,
      display: "block",
    },
  };
}

export function cropToJson(raw?: ImageCropSettings | Record<string, unknown> | null): ImageCropSettings {
  const crop = normalizeImageCrop(raw);
  return {
    fitMode: crop.fitMode,
    posX: crop.posX,
    posY: crop.posY,
    zoom: crop.zoom,
    aspectPreset: crop.aspectPreset,
    frameShape: crop.frameShape,
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isFrameShape(value: unknown): value is ImageFrameShape {
  return ["square", "rounded", "circle", "wide", "banner", "card"].includes(String(value));
}

function frameRadius(shape: ImageFrameShape): string {
  if (shape === "circle") return "9999px";
  if (shape === "square" || shape === "wide" || shape === "banner") return "0.75rem";
  if (shape === "card") return "var(--site-card-radius, 1.5rem)";
  return "1rem";
}
