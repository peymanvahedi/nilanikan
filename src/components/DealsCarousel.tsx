"use client";
import React, { useEffect, useRef, useState } from "react";

type Product = {
  id: string;
  title: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  discountBadge?: string; // مثلا "20٪"
  image: string;
};

// NOTE: اگر محصول‌ها را از API می‌گیری، این قسمت را حذف کن و از props بده.
function useSeedProducts(): Product[] {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    // تلاش برای خواندن از localStorage (کلید: dealProducts)
    try {
      const raw = localStorage.getItem("dealProducts");
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr) && arr.length) {
        setItems(arr);
        return;
      }
    } catch {}
    // نمونهٔ موقت
    setItems([
      { id: "1", title: "ریمل حجم‌دهنده این‌لی", brand: "این‌لی", price: 290000, oldPrice: 550000, discountBadge: "40٪", image: "/placeholder/1.png" },
      { id: "2", title: "سرم مو حاوی آرگان 75ml", brand: "تاپ شاپ", price: 1381600, oldPrice: 2438000, discountBadge: "60٪", image: "/placeholder/2.png" },
      { id: "3", title: "کرم مرطوب‌کننده 75ml", brand: "ماکسیملیان", price: 560000, oldPrice: 1400000, discountBadge: "60٪", image: "/placeholder/3.png" },
      { id: "4", title: "پاوربانک 10000", brand: "کاوسیگا", price: 776800, oldPrice: 970000, discountBadge: "20٪", image: "/placeholder/4.png" },
      { id: "5", title: "ژل ضدآفتاب روشن‌کننده", brand: "ساین‌اسکین", price: 297000, oldPrice: 495000, discountBadge: "40٪", image: "/placeholder/5.png" },
      { id: "6", title: "محصول نمونه ۶", brand: "برند", price: 420000, oldPrice: 690000, discountBadge: "30٪", image: "/placeholder/6.png" },
    ]);
  }, []);
  return items;
}

export default function DealsCarousel() {
  const products = useSeedProducts();

  const railRef = useRef<HTMLDivElement | null>(null);
  const stepRef = useRef(0);

  // محاسبهٔ گام اسکرول بر اساس اولین کارت
  useEffect(() => {
    const el = railRef.current?.querySelector("[data-card]") as HTMLElement | null;
    if (el) stepRef.current = el.offsetWidth + 16; // +gap
  }, [products.length]);

  // اسکرول نرم
  const scrollBy = (dir: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * (stepRef.current || 300), behavior: "smooth" });
  };

  // درگ/تاچ
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.setPointerCapture?.(e.pointerId);
    dragging.current = true;
    startX.current = e.clientX;
    startScroll.current = rail.scrollLeft;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rail = railRef.current;
    if (!rail) return;
    const dx = e.clientX - startX.current;
    rail.scrollLeft = startScroll.current - dx;
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  // تایمر نمایشی (سه باکس سفید)
  const [hhmmss, setHhmmss] = useState([0, 0, 0]);
  useEffect(() => {
    const end = Date.now() + 1000 * 60 * 60 * 2 + 1000 * 60 * 14 + 1000 * 45; // نمایشی
    const t = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setHhmmss([h, m, s]);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!products.length) return null;

  return (
    <section className="mt-6 md:mt-8">
      <div className="flex gap-4">
        {/* ریل محصولات */}
        <div className="relative flex-1">
          <div
            ref={railRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-2 md:px-3 scroll-smooth no-scrollbar"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            dir="rtl"
          >
            {products.map((p) => (
              <article
                key={p.id}
                data-card
                className="snap-start shrink-0 basis-[220px] md:basis-[260px] rounded-2xl border border-pink-300/70 bg-white shadow-sm overflow-hidden"
              >
                {/* اگر ProductCard خودت را می‌خواهی، این بلوک را با <ProductCard product={p}/> عوض کن */}
                <div className="p-3 pb-0 flex items-center justify-center h-36 md:h-40">
                  <img src={p.image} alt={p.title} className="h-full object-contain" />
                </div>
                <div className="px-3 pt-2">
                  <p className="text-xs text-gray-500">{p.brand}</p>
                  <h3 className="mt-1 text-sm line-clamp-2">{p.title}</h3>
                </div>
                <div className="flex items-end justify-between px-3 py-3">
                  <span className="inline-flex items-center rounded-md bg-pink-600 text-white text-xs px-2 py-1">
                    {p.discountBadge ?? "٪"}
                  </span>
                  <div className="text-left">
                    {p.oldPrice && (
                      <div className="text-[11px] text-gray-400 line-through">
                        {p.oldPrice.toLocaleString("fa-IR")} تومان
                      </div>
                    )}
                    <div className="text-sm font-semibold">
                      {p.price.toLocaleString("fa-IR")} تومان
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* دکمه‌های چپ/راست */}
          <button
            aria-label="قبلی"
            onClick={() => scrollBy(-1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-gradient-to-b from-white/90 to-white/60 shadow-xl hover:from-white hover:to-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 group-hover:bg-white text-gray-800 text-xl leading-none">›</span>
          </button>
          <button
            aria-label="بعدی"
            onClick={() => scrollBy(1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-gradient-to-b from-white/90 to-white/60 shadow-xl hover:from-white hover:to-white"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 group-hover:bg-white text-gray-800 text-xl leading-none">‹</span>
          </button>
        </div>

        {/* سایدبار صورتی */}
        <aside className="w-[190px] md:w-[220px] rounded-2xl bg-pink-600 text-white p-4 flex flex-col items-center justify-between">
          <div className="w-full">
            <h3 className="text-2xl font-semibold text-right">جعبه صورتی</h3>
            <p className="mt-2 text-sm text-right opacity-95">بزرگ‌ترین حراج روزانه</p>
          </div>
          <img src="/placeholder/deal-box.png" alt="" className="my-3 h-24 object-contain" />
          <div className="flex gap-2">
            {hhmmss.map((v, i) => (
              <div key={i} className="bg-white text-pink-700 rounded-md px-2.5 py-1.5 font-bold">{String(v).padStart(2, "0")}</div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
