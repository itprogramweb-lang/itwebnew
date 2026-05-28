"use client";

import { useState } from "react";

export default function FallbackImage({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src?: string | null;
  fallbackSrc: string;
  alt: string;
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}
