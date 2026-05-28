"use client";

import { useEffect, useState } from "react";
import { buildImageCropStyle, type ImageCropSettings } from "@/lib/imageCrop";

type Props = {
  src?: string | null;
  fallbackSrc?: string;
  alt: string;
  crop?: ImageCropSettings | Record<string, unknown> | null;
  className?: string;
  imgClassName?: string;
};

export default function CroppedImage({
  src,
  fallbackSrc,
  alt,
  crop,
  className = "",
  imgClassName = "",
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || "");
  const { wrapperStyle, imgStyle } = buildImageCropStyle(crop);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || "");
  }, [src, fallbackSrc]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={wrapperStyle}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          className={`block h-full w-full object-cover ${imgClassName}`}
          style={imgStyle}
          onError={() => {
            if (fallbackSrc && currentSrc !== fallbackSrc) {
              setCurrentSrc(fallbackSrc);
            }
          }}
        />
      ) : null}
    </div>
  );
}