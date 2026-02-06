import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import sourceLogo from "@/assets/emil-invest-logo-blue.png";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

function colorDistance(a: [number, number, number], b: [number, number, number]) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function avgCornerColor(data: Uint8ClampedArray, width: number, height: number) {
  // sample a small patch in each corner and average
  const patch = Math.max(6, Math.floor(Math.min(width, height) * 0.03));
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - patch, 0],
    [0, height - patch],
    [width - patch, height - patch],
  ];

  let r = 0,
    g = 0,
    b = 0,
    n = 0;

  for (const [sx, sy] of corners) {
    for (let y = sy; y < sy + patch; y++) {
      for (let x = sx; x < sx + patch; x++) {
        const idx = (y * width + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        n++;
      }
    }
  }

  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as [number, number, number];
}

async function makeTransparentPng(url: string) {
  const img = new Image();
  img.crossOrigin = "anonymous";

  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Kunne ikke laste logo"));
  });

  img.src = url;
  await loaded;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ikke støttet");

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;

  // Determine background from corners (the blue area)
  const bg = avgCornerColor(d, canvas.width, canvas.height);

  // Distance threshold: tweakable. Higher = remove more.
  const threshold = 80;

  for (let i = 0; i < d.length; i += 4) {
    const rgb = [d[i], d[i + 1], d[i + 2]] as [number, number, number];
    const dist = colorDistance(rgb, bg);

    // If close to background color, set fully transparent.
    if (dist < threshold) {
      d[i + 3] = 0;
      continue;
    }

    // Soft edge: partially fade pixels that are near the threshold
    if (dist < threshold + 25) {
      const t = (dist - threshold) / 25; // 0..1
      d[i + 3] = Math.round(d[i + 3] * t);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function BrandLogo({ className, alt = "EMIL Invest" }: BrandLogoProps) {
  const [src, setSrc] = useState<string>(sourceLogo);

  const cacheKey = useMemo(() => `brandlogo:v1:${sourceLogo}`, []);

  useEffect(() => {
    const cached = typeof window !== "undefined" ? window.localStorage.getItem(cacheKey) : null;
    if (cached) {
      setSrc(cached);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const transparent = await makeTransparentPng(sourceLogo);
        if (cancelled) return;
        setSrc(transparent);
        window.localStorage.setItem(cacheKey, transparent);
      } catch {
        // fallback to original
        if (!cancelled) setSrc(sourceLogo);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  return <img src={src} alt={alt} className={cn("block", className)} />;
}
