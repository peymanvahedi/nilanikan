"use client";

import React, { useEffect, useMemo, useState } from "react";
import { productHref } from "@/lib/productHref";

type CatalogAttr = { key: string; value: string };
type CatalogProduct = {
  id: string;
  title: string;
  sku?: string;
  brand?: string;
  categoryIds: string[];
  price: number;
  oldPrice?: number;
  url?: string;
  image: string;
  gallery?: string[];
  tags?: string[];
  attributes?: CatalogAttr[];
  rating?: number;
  stock?: number;
};

type AmazingProduct = {
  id: string;
  productId?: string;
  title: string;
  image: string;
  price: number;
  oldPrice?: number;
  category: string;
  rating?: number;
  badge?: string;
  url?: string;
  bundleIds?: string[];
};

type CatalogCategory = { id: string; name: string; slug: string; parentId?: string | null };

export default function ProductPageClient({ slug }: { slug: string }) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [amazing, setAmazing] = useState<AmazingProduct[]>([]);
  const [cats, setCats] = useState<CatalogCategory[]>([]);
  const [product, setProduct] = useState<CatalogProduct | null>(null);

  // 1) Load data from localStorage (Admin panel)
  useEffect(() => {
    try {
      const catRaw = localStorage.getItem("catalogProducts");
      const amzRaw = localStorage.getItem("amazingProducts");
      const cRaw = localStorage.getItem("catalogCategories");

      setCatalog(catRaw ? JSON.parse(catRaw) : []);
      setAmazing(amzRaw ? JSON.parse(amzRaw) : []);
      setCats(cRaw ? JSON.parse(cRaw) : []);
    } catch {
      setCatalog([]);
      setAmazing([]);
      setCats([]);
    }
  }, []);

  // 2) Parse id from slug and find product
  useEffect(() => {
    const idFromSlug = (s: string) => s.split("-")[0]; // pattern: {id}-{title}
    const id = idFromSlug(slug);

    const fromCatalog = catalog.find((p) => p.id === id) || null;
    if (fromCatalog) return setProduct(fromCatalog);

    // اگر از شگفت‌انگیز آمده
    const fromAmazing = amazing.find((a) => a.productId === id || a.id === id);
    if (fromAmazing) {
      // تبدیل به فرم کاتالوگ موقت
      const tmp: CatalogProduct = {
        id: fromAmazing.productId || fromAmazing.id,
        title: fromAmazing.title,
        price: fromAmazing.price,
        oldPrice: fromAmazing.oldPrice,
        image: fromAmazing.image,
        url: fromAmazing.url,
        categoryIds: [], // نداریم؛ فقط برای نمایش
        gallery: [fromAmazing.image],
        attributes: [],
        rating: fromAmazing.rating,
      };
      setProduct(tmp);
    }
  }, [slug, catalog, amazing]);

  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    cats.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cats]);

  const catNames = useMemo(() => {
    if (!product) return [];
    return (product.categoryIds || []).map((id) => catMap.get(id)).filter(Boolean) as string[];
  }, [product, catMap]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const g = product.gallery && product.gallery.length ? product.gallery : [product.image];
    return g.filter(Boolean);
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    // اولویت: همان دسته‌ها
    const ids = new Set(product.categoryIds || []);
    const list = catalog
      .filter((p) => p.id !== product.id && p.categoryIds?.some((cid) => ids.has(cid)))
      .slice(0, 12);
    // اگر خالی بود، از شگفت‌انگیز هم اضافه کن
    if (list.length > 0) return list;
    const fromAmz = amazing
      .map((a) => {
        const id = a.productId || a.id;
        return {
          id,
          title: a.title,
          price: a.price,
          oldPrice: a.oldPrice,
          image: a.image,
          url: a.url,
          categoryIds: [],
        } as CatalogProduct;
      })
      .filter((p) => p.id !== product.id)
      .slice(0, 12);
    return fromAmz;
  }, [product, catalog, amazing]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
          محصول پیدا نشد.
        </div>
      </div>
    );
  }

  const formatIR = (n: number) => {
    try { return n.toLocaleString("fa-IR"); } catch { return String(n); }
  };
  const offPercent =
    !product.oldPrice || product.oldPrice <= product.price
      ? null
      : Math.round((1 - product.price / product.oldPrice) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* breadcrumb ساده */}
      <div className="text-xs text-gray-500 mb-4">
        <a href="/" className="hover:text-pink-600">خانه</a>
        <span className="mx-2">/</span>
        {catNames.length > 0 ? (
          <>
            <a href="#" className="hover:text-pink-600">{catNames[0]}</a>
            <span className="mx-2">/</span>
          </>
        ) : null}
        <span className="text-gray-700">{product.title}</span>
      </div>

      {/* main */}
      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl border p-5">
        {/* گالری */}
        <div>
          <div className="aspect-square w-full border rounded-xl overflow-hidden grid place-items-center">
            <img src={gallery[0]} alt={product.title} className="max-h-full object-contain" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // تصویر اصلی را جابجا کن
                    const arr = [...gallery];
                    [arr[0], arr[i]] = [arr[i], arr[0]];
                    // چون گالری از useMemo میاد، برای پرهیز از state پیچیده،
                    // فقط src اصلی را جایگزین کنیم:
                    const main = arr[0];
                    (document.querySelector("#pp-main") as HTMLImageElement | null)?.setAttribute("src", main);
                  }}
                  className="w-16 h-16 border rounded-lg overflow-hidden shrink-0"
                  title="پیش‌نمایش"
                >
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* اطلاعات */}
        <div className="space-y-4">
          <h1 className="text-lg md:text-xl font-bold text-gray-800">{product.title}</h1>

          {product.brand && (
            <div className="text-sm text-gray-500">
              برند: <span className="text-gray-700">{product.brand}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gray-900">
              {formatIR(product.price)} <span className="text-sm font-normal text-gray-500">تومان</span>
            </div>
            {product.oldPrice && (
              <div className="text-sm text-gray-400 line-through">{formatIR(product.oldPrice)}</div>
            )}
            {offPercent !== null && (
              <span className="inline-flex items-center rounded bg-red-500 text-white text-xs px-2 py-1">
                ٪{offPercent} تخفیف
              </span>
            )}
          </div>

          {typeof product.rating === "number" && (
            <div className="text-amber-600 text-sm">
              {"★".repeat(Math.round(product.rating))}
              <span className="text-gray-400"> ({product.rating})</span>
            </div>
          )}

          {/* ویژگی‌ها */}
          {product.attributes && product.attributes.length > 0 && (
            <div>
              <div className="font-medium mb-2">ویژگی‌ها</div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {product.attributes.map((a, i) => (
                  <li key={i} className="border rounded-lg p-2 flex items-center justify-between">
                    <span className="text-gray-500">{a.key}</span>
                    <span className="font-medium">{a.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* دکمه‌ها */}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700">
              افزودن به سبد
            </button>
            <a
              href="#related"
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              محصولات مرتبط
            </a>
          </div>

          {/* برچسب‌ها */}
          {product.tags && product.tags.length > 0 && (
            <div className="text-xs flex flex-wrap gap-2">
              {product.tags.map((t, i) => (
                <span key={i} className="px-2 py-1 border rounded-full bg-gray-50">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* مرتبط‌ها */}
      <div id="related" className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base md:text-lg font-bold text-gray-800">محصولات مرتبط</h2>
        </div>

        {related.length === 0 ? (
          <div className="text-sm text-gray-500 border rounded-lg bg-white p-4">
            موردی یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {related.map((p) => {
              const href = productHref({ id: p.id, title: p.title, url: p.url });
              const off =
                !p.oldPrice || p.oldPrice <= p.price
                  ? null
                  : Math.round((1 - p.price / p.oldPrice) * 100);
              return (
                <a key={p.id} href={href} className="border rounded-xl p-3 bg-white hover:shadow transition">
                  <div className="relative">
                    <img src={p.image} alt={p.title} className="w-full h-[160px] object-contain" />
                    {off !== null && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">٪{off}</span>
                    )}
                  </div>
                  <div className="mt-2 text-[13px] line-clamp-2 min-h-[40px]">{p.title}</div>
                  <div className="mt-1 font-bold text-gray-900 text-sm">
                    {formatIR(p.price)} <span className="text-xs font-normal text-gray-500">تومان</span>
                  </div>
                  {p.oldPrice && <div className="text-xs text-gray-400 line-through">{formatIR(p.oldPrice)}</div>}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
