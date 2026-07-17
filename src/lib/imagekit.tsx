import { ImageKitProvider } from '@imagekit/react';
import type { ReactNode } from 'react';

const urlEndpoint = 'https://ik.imagekit.io/i67rlxsde';

export function ImageKit({ children }: { children: ReactNode }) {
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      {children}
    </ImageKitProvider>
  );
}

export { urlEndpoint };

/**
 * Appends ImageKit CDN transformation parameters to an image URL.
 * - For ImageKit-hosted URLs (ik.imagekit.io), appends tr: params directly.
 * - For other URLs (e.g. external), returns as-is (CDN can't transform them).
 *
 * @param src   Original image URL
 * @param opts  Transformation options
 * @returns     Optimized image URL with tr: params
 */
export function ikImage(
  src: string | undefined | null,
  opts: {
    w?: number;
    h?: number;
    q?: number;
    format?: 'webp' | 'auto' | 'jpg' | 'png';
    blur?: number;
    crop?: boolean; // ক্রপ করার জন্য নতুন অপশন যুক্ত করা হলো
  } = {},
): string {
  if (!src) return '';
  const { w, h, q = 80, format = 'webp', crop = false } = opts;

  // Only transform ImageKit-hosted URLs
  if (!src.includes('ik.imagekit.io')) return src;

  const tr: string[] = [];
  if (w) tr.push(`w-${w}`);
  if (h) tr.push(`h-${h}`);
  tr.push(`q-${q}`);
  tr.push(`f-${format}`);
  
  // যদি ক্রপ ট্রু (true) থাকে, তবে ইমেজকিট ছবিটাকে টেনে নষ্ট না করে স্মার্টলি স্কয়ার (1:1) ক্রপ করবে
  if (crop && w && h) {
    tr.push('fo-auto'); // ফোকাস অটো রাখবে যাতে মেইন অবজেক্ট কেটে না যায়
  } else if (w && h) {
    tr.push('c-maintain_ratio');
  }

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}tr=${tr.join(',')}`;
}

/** Thumbnail (300x300 webp) for product cards and grids */
export function ikThumb(src: string | undefined | null): string {
  return ikImage(src, { w: 300, h: 300, q: 80, format: 'webp', crop: true });
}

/** Medium (600x600 webp) for product detail main image */
export function ikMedium(src: string | undefined | null): string {
  return ikImage(src, { w: 600, h: 600, q: 85, format: 'webp', crop: true });
}

/** Large (900x900 webp) for zoomed product detail view */
export function ikLarge(src: string | undefined | null): string {
  return ikImage(src, { w: 900, h: 900, q: 90, format: 'webp', crop: true });
}

/** Banner (1200px wide, auto height) for hero banners */
export function ikBanner(src: string | undefined | null): string {
  return ikImage(src, { w: 1200, q: 85, format: 'webp' });
}

/** ওভির জন্য স্পেশাল ফাংশন: যেকোনো ছবিকে অটোমেটিক ১২০০ গুণ ১২০০ স্কয়ার সাইজে ক্রপ করবে */
export function ikSquareEdit(src: string | undefined | null): string {
  return ikImage(src, { w: 1200, h: 1200, q: 85, format: 'webp', crop: true });
}
