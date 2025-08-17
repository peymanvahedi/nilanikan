"use client";

import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceBefore?: number | null;
  images: any;
};

type ListResp = { items: Product[] };

type AmazingConfigState = {
  mode: "auto" | "manual";
  categoryId?: string;
  brandId?: string;
  limit: number;
  minDiscount: number;
  sort: "discountDesc" | "newest" | "priceAsc" | "priceDesc";
};

const CFG_KEY = "amazing.config.v1";
const MANUAL_KEY = "admin.amazing"; // همان لیست دستی قبلی

const fa = (n: number) => n?.toLocaleString?.("fa-IR");

const primaryUrl = (images: any): string | null => {
  if (!Array.isArray(images)) return null;
  const p = images.find((x) => x?.primary) || images[0];
  return p?.url || null;
};

const discountOf = (p: Product) => {
  if (!p.priceBefore || p.priceBefore <= p.price) return 0;
  return Math.round((1 - p.price / p.priceBefore) * 100);
};

export default function AmazingSlider({ showHeader = true, title = "محصولات شگفت‌انگیز" }: { showHeader?: boolean; title?: string }) {
  const [cfg, setCfg] = useState<AmazingConfigState>({
    mode: "manual",
    limit: 10,
    minDiscount: 0,
    sort: "discountDesc",
  });
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // خواندن تنظیمات + داده‌ها
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CFG_KEY);
      if (raw) setCfg((s) => ({ ...s, ...(JSON.parse(raw) as any) }));
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (cfg.mode === "auto") {
          const sp = new URLSearchParams();
          if (cfg.categoryId) sp.set("categoryId", cfg.categoryId);
          if (cfg.brandId) sp.set("brandId", cfg.brandId);
          // نگاشت sort به API
          const apiSort =
            cfg.sort === "discountDesc"
              ? "newest" // بعداً در کلاینت با تخفیف مرتب می‌کنیم
              : cfg.sort;
          sp.set("sort", apiSort);
          sp.set("page", "1");
          sp.set("pageSize", String(Math.max(1, cfg.limit || 10)));

          const res = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" });
          const j: ListResp = await res.json();
          let arr = Array.isArray(j?.items) ? j.items : [];

          // فیلتر حداقل تخفیف
          if (cfg.minDiscount > 0) {
            arr = arr.filter((p) => discountOf(p) >= cfg.minDiscount);
          }

          // مرتب‌سازی بیشترین تخفیف (اگر انتخاب شده بود)
          if (cfg.sort === "discountDesc") {
            arr = arr.sort((a, b) => discountOf(b) - discountOf(a));
          }

          setItems(arr.slice(0, cfg.limit || 10));
        } else {
          // حالت دستی: از localStorage
          const raw = localStorage.getItem(MANUAL_KEY);
          const arr = raw ? (JSON.parse(raw) as any[]) : [];
          // تبدیل به شکل Product برای نمایش یکنواخت
          const mapped: Product[] = Array.isArray(arr)
            ? arr
                .map((x) => ({
                  id: x.id || `a-${Math.random()}`,
                  title: x.title || "",
                  slug: x.slug || "",
                  price: Number(x.price || 0),
                  priceBefore: x.oldPrice ?? null,
                  images: [{ url: x.image, primary: true }],
                }))
                .filter((x) => !!x.title && !!primaryUrl(x.images))
            : [];
          setItems(mapped);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [cfg.mode, cfg.categoryId, cfg.brandId, cfg.limit, cfg.minDiscount, cfg.sort]);

  const slides = useMemo(() => items, [items]);
  if (loading) return null;
  if (!slides.length) return null;

  return (
    <div>
      {showHeader && <h3 className="text-lg font-bold mb-3">🔥 {title}</h3>}
      <div className="relative">
        <button
          className="az-prev absolute right-2 -top-10 md:top-1/2 md:-translate-y-1/2 z-10 rounded-full bg-white/90 shadow p-2 hover:bg-white"
          aria-label="قبلی"
        >
          ‹
        </button>
        <button
          className="az-next absolute left-2 -top-10 md:top-1/2 md:-translate-y-1/2 z-10 rounded-full bg-white/90 shadow p-2 hover:bg-white"
          aria-label="بعدی"
        >
          ›
        </button>

        <Swiper
          modules={[Navigation]}
          navigation={{ nextEl: ".az-next", prevEl: ".az-prev" }}
          slidesPerView={2}
          spaceBetween={12}
          breakpoints={{
            640: { slidesPerView: 3, spaceBetween: 14 },
            1024: { slidesPerView: 5, spaceBetween: 16 },
          }}
        >
          {slides.map((p) => {
            const img = primaryUrl(p.images) || "";
            const off = discountOf(p);
            return (
              <SwiperSlide key={p.id}>
                <a href={`/product/${p.slug || p.id}`} className="block">
                  <div className="border rounded-xl overflow-hidden bg-white hover:shadow transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={p.title} className="w-full h-48 object-cover" loading="lazy" />
                    <div className="p-3">
                      <div className="text-sm line-clamp-2 h-10">{p.title}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-pink-600 font-bold">{fa(p.price)} تومان</div>
                        {p.priceBefore ? (
                          <div className="text-xs text-gray-400 line-through">{fa(p.priceBefore)} تومان</div>
                        ) : (
                          <span />
                        )}
                      </div>
                      {off > 0 && (
                        <div className="mt-1 text-xs inline-flex bg-rose-100 text-rose-700 rounded px-2 py-0.5">٪{off}</div>
                      )}
                    </div>
                  </div>
                </a>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
