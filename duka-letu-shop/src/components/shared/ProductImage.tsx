"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveImage } from "@/lib/images";
import { cx } from "./ui";

/**
 * Fixed-ratio product photo. Resolves IndexedDB uploads ("idb:") and shows a
 * neutral fallback when a photo is missing or fails to load.
 */
export function ProductImage({ src, alt, className, fit = "cover", sizes, priority }: {
  src?: string; alt: string; className?: string; fit?: "cover" | "contain"; sizes?: string; priority?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(src && !src.startsWith("idb:") ? src : null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    if (!src) { setUrl(null); return; }
    if (!src.startsWith("idb:")) { setUrl(src); return; }
    resolveImage(src).then((u) => { if (alive) { setUrl(u); if (!u) setFailed(true); } });
    return () => { alive = false; };
  }, [src]);

  return (
    <div className={cx("relative overflow-hidden bg-sunken", className)}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url} alt={alt} sizes={sizes} loading={priority ? "eager" : "lazy"} decoding="async"
          onError={() => setFailed(true)}
          className={cx("absolute inset-0 h-full w-full", fit === "cover" ? "object-cover" : "object-contain")}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-3">
          <ImageOff className="h-6 w-6" aria-hidden />
          <span className="text-[11px]">{src ? "Photo unavailable" : "No photo yet"}</span>
        </div>
      )}
    </div>
  );
}
