// src/app/product/[slug]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

/* ---------- Types ---------- */
type Attr = { key: string; value: string };
type ApiBrand = { id: string; name: string } | null | undefined;
type ApiCategory = { id: string; name: string } | null | undefined;

type ApiProduct = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price: number;
  priceBefore?: number | null;
  images?: any;
  brand?: ApiBrand;
  category?: ApiCategory;
};

type Product = {
  id: string;
  title: string;
  brand?: string;
  description?: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery?: string[];
  rating?: number;
  categoryIds?: string[];
  attributes?: Attr[];
};
type Category = { id: string; name: string };

/* ---------- Utils ---------- */
const formatIR = (n: number) => {
  try {
    return n.toLocaleString("fa-IR");
  } catch {
    return String(n);
  }
};
const discountPercent = (price: number, oldPrice?: number | null) =>
  !oldPrice || oldPrice <= price ? null : Math.round((1 - price / oldPrice) * 100);

const firstImage = (imgs: any): string => {
  if (!Array.isArray(imgs)) return "";
  for (const v of imgs) {
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && typeof v.url === "string") return v.url;
  }
  return "";
};
const allImages = (imgs: any): string[] => {
  if (!Array.isArray(imgs)) return [];
  const out: string[] = [];
  for (const v of imgs) {
    if (typeof v === "string") out.push(v);
    else if (v && typeof v === "object" && typeof v.url === "string") out.push(v.url);
  }
  return out;
};

const looksLikeId = (s: string) => /^[a-z0-9]{16,}$/i.test(s);

/* ---------- LocalStorage helpers (fallback) ---------- */
function readProdFromLS(handle: string): Product | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const aRaw = localStorage.getItem("amazingProducts");
    const cRaw = localStorage.getItem("catalogProducts");
    const a: Product[] = aRaw ? JSON.parse(aRaw) : [];
    const c: Product[] = cRaw ? JSON.parse(cRaw) : [];
    const all = [...c, ...a];
    const found =
      all.find((p) => (p.id || "").toLowerCase() === handle.toLowerCase()) ||
      all.find((p) => (p.id || "").toLowerCase().startsWith(handle.toLowerCase())) ||
      all.find((p) => (p as any).slug === handle);
    return (found as Product) || null;
  } catch {
    return null;
  }
}
function readCats(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("catalogCategories") || "[]");
  } catch {
    return [];
  }
}

/* ---------- Template helpers ---------- */
const safe = (v: any) => (v ?? "").toString();
const escapeHtml = (s: string) =>
  safe(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function renderTemplate(tpl: string, prod: Product, cats: Category[], slug: string) {
  const images = Array.from(new Set([...(prod.image ? [prod.image] : []), ...(prod.gallery || [])]));
  const thumbs = images
    .map((src) => `<img src="${src}" class="w-[72px] h-[72px] object-contain border rounded" />`)
    .join("");
  const off = discountPercent(prod.price, prod.oldPrice);
  const catMap = new Map(cats.map((c) => [c.id, c.name] as const));
  const catNames = (prod.categoryIds || []).map((id) => catMap.get(id)).filter(Boolean).join("، ");

  return tpl
    .replaceAll("{{title}}", escapeHtml(prod.title))
    .replaceAll("{{brand}}", escapeHtml(prod.brand || ""))
    .replaceAll("{{price}}", formatIR(prod.price))
    .replaceAll("{{oldPrice}}", prod.oldPrice ? formatIR(prod.oldPrice) : "")
    .replaceAll("{{discount}}", off ? String(off) : "")
    .replaceAll("{{slug}}", escapeHtml(slug))
    .replaceAll("{{categories}}", escapeHtml(catNames || ""))
    .replaceAll("{{image}}", images[0] || "")
    .replaceAll("{{thumbnails}}", thumbs)
    .replaceAll("{{breadcrumbs}}", escapeHtml(catNames || ""));
}

/* ---------- API loaders ---------- */
const normalizeApiProduct = (p: ApiProduct): Product => ({
  id: p.id,
  title: p.title,
  description: p.description,
  brand: p.brand?.name || undefined,
  price: p.price,
  oldPrice: p.priceBefore ?? undefined,
  image: firstImage(p.images),
  gallery: allImages(p.images),
  categoryIds: p.category?.id ? [p.category.id] : [],
});

async function fetchProductByIdOrSlug(handle: string): Promise<Product | null> {
  // 1) try by ID
  if (looksLikeId(handle)) {
    try {
      const r = await fetch(`/api/products/${encodeURIComponent(handle)}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.id) return normalizeApiProduct(j as ApiProduct);
    } catch {}
  }

  // 2) try by slug
  try {
    const sp = new URLSearchParams({ slug: handle, page: "1", pageSize: "1" });
    const r = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    const p = j?.items?.[0];
    if (r.ok && p?.id) return normalizeApiProduct(p as ApiProduct);
  } catch {}

  // 3) last try by q
  try {
    const sp = new URLSearchParams({ q: handle, page: "1", pageSize: "1" });
    const r = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    const p = j?.items?.[0];
    if (r.ok && p?.id) return normalizeApiProduct(p as ApiProduct);
  } catch {}

  return null;
}

/* ---------- Page ---------- */
export default function ProductPage() {
  const params = useParams();
  const slug = String((params as any)?.slug || "");
  const shortId = useMemo(() => (slug.split("-").pop() || "").toLowerCase(), [slug]);

  const [prod, setProd] = useState<Product | null | undefined>(undefined);
  const [cats, setCats] = useState<Category[]>([]);
  const [tpl, setTpl] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProd(undefined);
      try {
        const apiP = await fetchProductByIdOrSlug(slug);
        if (!cancelled && apiP) {
          setProd(apiP);
          return;
        }
      } catch {}
      if (!cancelled) setProd(readProdFromLS(shortId) ?? null);
    })();
    setCats(readCats());
    try {
      setTpl(localStorage.getItem("productTemplateV1"));
    } catch {}
    return () => {
      cancelled = true;
    };
  }, [slug, shortId]);

  const images = useMemo(
    () => Array.from(new Set([...(prod?.image ? [prod.image] : []), ...(prod?.gallery || [])].filter(Boolean))),
    [prod]
  );
  const [thumb, setThumb] = useState(0);
  useEffect(() => setThumb(0), [prod?.id]);

  const off = discountPercent(prod?.price ?? 0, prod?.oldPrice);
  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    (cats || []).forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);
  const catNames = (prod?.categoryIds || []).map((id) => catMap.get(id)).filter(Boolean).join("، ");

  const getGuestId = () => {
    try {
      const k = "guestId";
      let id = localStorage.getItem(k);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(k, id);
      }
      return id;
    } catch {
      return "guest";
    }
  };
  const addToCart = async () => {
    if (!prod?.id) return alert("محصول نامعتبر است");
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getGuestId(),
          productId: prod.id,
          qty: 1,
          price: prod.price,
          title: prod.title,
          image: images[0] || "",
          slug,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "خطا در افزودن به سبد");
      }
      alert("به سبد اضافه شد ✅");
    } catch (err: any) {
      alert(err?.message || "خطا");
    } finally {
      setAdding(false);
    }
  };

  if (prod === undefined) return null;

  if (prod === null) {
    return (
      <main className="container mx-auto max-w-6xl p-6">
        <div className="bg-white border rounded-2xl p-8 text-gray-600 text-center">محصول پیدا نشد.</div>
      </main>
    );
  }

  if (tpl) {
    const html = renderTemplate(tpl, prod, cats, slug);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <main className="container mx-auto max-w-[1200px] p-4">
      {/* Breadcrumb */}
      <nav className="text-[12px] text-gray-500 mb-3">
        <a href="/" className="hover:text-pink-600">
          خانه
        </a>
        <span className="mx-1">›</span>
        <span>{catNames || "بدون دسته"}</span>
      </nav>

      {/* Title & slug */}
      <header className="text-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-9">{prod.title}</h1>
        <div className="mt-1 flex items-center justify-center gap-2 text-xs md:text-sm text-gray-500">
          <span className="hidden sm:inline">نامک:</span>
          <code dir="ltr" className="rounded border bg-gray-50 px-2 py-0.5">
            {slug}
          </code>
        </div>
        {prod.brand && <div className="text-sm text-gray-500 mt-1">برند: {prod.brand}</div>}
      </header>

      {/* Main grid */}
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        {/* Gallery */}
        <section className="border rounded-2xl p-4">
          <div className="grid grid-cols-[1fr_84px] gap-4">
            <div className="relative border rounded-xl p-3 grid place-items-center">
              {off !== null && (
                <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs px-2 py-1 rounded">٪{off}</span>
              )}
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[thumb]} alt={prod.title} className="max-h-[520px] object-contain" />
              ) : (
                <div className="h-[520px] w-full grid place-items-center text-gray-400 text-sm">تصویری موجود نیست</div>
              )}
              {images.length > 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border bg-white/80 p-2 text-gray-600 hover:bg-white"
                  onClick={() => setThumb((t) => (t + 1) % images.length)}
                  aria-label="بعدی"
                >
                  <ArrowRight />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 overflow-auto max-h-[520px]">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setThumb(i)}
                  className={`border rounded-xl p-1 transition ${i === thumb ? "border-pink-500" : "border-gray-200 hover:shadow-sm"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-[72px] h-[72px] object-contain" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1 text-gray-400">
              <HeartIcon />
              <span>علاقه‌مندی</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <ChatIcon />
              <span>دیدگاه</span>
            </div>
          </div>
        </section>

        {/* Price & CTA */}
        <aside className="bg-white border rounded-2xl p-5 self-start">
          <ul className="space-y-3 text-sm text-gray-700 mb-4">
            <li className="flex items-center gap-3">
              <ShieldIcon /> <span>ضمانت اصالت و سلامت کالا</span>
            </li>
            <li className="flex items-center gap-3">
              <ReturnIcon /> <span>بازگشت کالا تا ۷ روز طبق شرایط مرجوعی</span>
            </li>
            <li className="flex items-center gap-3">
              <TruckIcon /> <span>ارسال رایگان برای سبدهای بالای ۲.۵ میلیون</span>
            </li>
          </ul>

          <div className="border rounded-xl p-4">
            {off !== null && <span className="inline-block bg-rose-500 text-white text-xs px-2 py-1 rounded mb-2">٪{off}</span>}
            {prod.oldPrice && <div className="text-sm text-gray-400 line-through">{formatIR(prod.oldPrice)}</div>}
            <div className="mt-1 text-3xl font-extrabold text-gray-900">
              {formatIR(prod.price)} <span className="text-sm font-normal text-gray-500">تومان</span>
            </div>
            <div className="mt-2 text-xs text-blue-600">امکان پرداخت اقساطی • متن نمونه</div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full border hover:bg-gray-50" aria-label="اشتراک‌گذاری">
                <ShareIcon />
              </button>
              <button className="p-2 rounded-full border hover:bg-gray-50" aria-label="علاقه‌مندی">
                <HeartIcon />
              </button>
            </div>
          </div>

          <button
            onClick={addToCart}
            disabled={adding}
            className="mt-3 w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white text-base py-3.5 rounded-xl"
          >
            {adding ? "در حال افزودن..." : "افزودن به سبد خرید"}
          </button>
        </aside>
      </div>

      {!!prod.attributes?.length && (
        <section className="mt-8 bg-white border rounded-2xl p-5">
          <h2 className="font-semibold text-gray-800 mb-3">ویژگی‌ها</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {prod.attributes!.map((a, i) => (
              <li key={`${a.key}-${i}`} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <span className="text-gray-500">{a.key}</span>
                <span className="text-gray-800">{a.value}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

/* ---------- Inline icons ---------- */
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M12 3l7 3v6c0 4-2.7 7.5-7 9-4.3-1.5-7-5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M3 7h11a5 5 0 010 10H7" />
      <path d="M7 7l-4 4 4 4" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M20.8 8.6a5.3 5.3 0 00-9.1-3.7L11 5.6l-.7-.7A5.3 5.3 0 002.1 8.6c0 1.5.6 3 1.7 4.1l8.1 8.1 8.1-8.1a5.8 5.8 0 001.7-4.1z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M21 11.5a8.5 8.5 0 11-3.5-6.9L21 4v7.5z" />
      <path d="M7 15l-4 4 1-5" />
    </svg>
  );
}
function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}