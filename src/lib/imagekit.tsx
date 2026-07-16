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
  } = {},
): string {
  if (!src) return '';
  const { w, h, q = 80, format = 'webp' } = opts;

  // Only transform ImageKit-hosted URLs
  if (!src.includes('ik.imagekit.io')) return src;

  const tr: string[] = [];
  if (w) tr.push(`w-${w}`);
  if (h) tr.push(`h-${h}`);
  tr.push(`q-${q}`);
  tr.push(`f-${format}`);
  if (w && h) tr.push('c-maintain_ratio');

  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}tr=${tr.join(',')}`;
}

/** Thumbnail (300x300 webp) for product cards and grids */
export function ikThumb(src: string | undefined | null): string {
  return ikImage(src, { w: 300, h: 300, q: 80, format: 'webp' });
}

/** Medium (600x600 webp) for product detail main image */
export function ikMedium(src: string | undefined | null): string {
  return ikImage(src, { w: 600, h: 600, q: 85, format: 'webp' });
}

/** Large (900x900 webp) for zoomed product detail view */
export function ikLarge(src: string | undefined | null): string {
  return ikImage(src, { w: 900, h: 900, q: 90, format: 'webp' });
}

/** Banner (1200px wide, auto height) for hero banners */
export function ikBanner(src: string | undefined | null): string {
  return ikImage(src, { w: 1200, q: 85, format: 'webp' });
}
