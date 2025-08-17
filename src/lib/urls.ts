// src/lib/urls.ts
export const slugify = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// از روی عنوان/آیدی لینک محصول بساز
export function productHref(p: { id?: string; title: string; url?: string }): string {
  if (!p) return "#";
  const u = p.url?.trim();
  if (u && (/^https?:\/\//i.test(u) || u.startsWith("/"))) return u;

  const short = (p.id || "").slice(0, 6) || "x";
  return `/product/${slugify(p.title)}-${short}`;
}

// --- کمکی‌ها برای صفحه محصول ---
export function extractShortIdFromSlug(slug: string): string | null {
  const m = (slug || "").match(/-([a-z0-9]{1,12})$/i);
  return m ? m[1].toLowerCase() : null;
}

export function getProductBySlug<T extends { id?: string; title?: string }>(
  list: T[],
  slug: string
): T | null {
  if (!Array.isArray(list) || !slug) return null;
  const short = extractShortIdFromSlug(slug);
  if (short) {
    const byId = list.find((p) => (p.id || "").toLowerCase().startsWith(short));
    if (byId) return byId;
  }
  const pure = slug.replace(/-([a-z0-9]{1,12})$/i, ""); // نامک بدون شناسه
  return list.find((p) => slugify(p.title || "") === pure) || null;
}
