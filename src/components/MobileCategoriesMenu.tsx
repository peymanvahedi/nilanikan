// src/components/MobileCategoriesMenu.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* آیکن‌ها (سبک) */
const Icons = {
  brands:     (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>),
  special:    (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9 5.5-.8L12 3z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  skincare:   (p:any)=>(<svg viewBox="0 0 24 24" {...p}><rect x="6" y="7" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M9 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2"/></svg>),
  makeup:     (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M6 20l5-5M3 21l3-1 8-8-2-2-8 8-1 3zM15 3l6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>),
  personal:   (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M8 3h8v4H8zM10 7v14m4-14v14" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  hair:       (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M8 4c2-2 6-2 8 0 2 2 2 6 0 8l-4 4-4-4C6 10 6 6 8 4z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  electric:   (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/></svg>),
  perfume:    (p:any)=>(<svg viewBox="0 0 24 24" {...p}><rect x="6" y="8" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M10 8V5h4v3" stroke="currentColor" strokeWidth="2"/></svg>),
  fashion:    (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M8 6h8l3 6-5 8H10L5 12l3-6z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  supplement: (p:any)=>(<svg viewBox="0 0 24 24" {...p}><rect x="4" y="3" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><rect x="7" y="15" width="10" height="6" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/></svg>),
  digital:    (p:any)=>(<svg viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M8 21h8" stroke="currentColor" strokeWidth="2"/></svg>),
  jewelry:    (p:any)=>(<svg viewBox="0 0 24 24" {...p}><circle cx="12" cy="13" r="6" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M9 5 12 3l3 2" stroke="currentColor" strokeWidth="2"/></svg>),
  magazine:   (p:any)=>(<svg viewBox="0 0 24 24" {...p}><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4z" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="2"/></svg>),
} as const;

type IconKey = keyof typeof Icons;

type Item = { id?: string; title: string; href: string; icon: IconKey; order?: number };

/** نگاشت کلیدهای API به آیکن‌های لوکال (personalcare → personal) */
const normalizeIconKey = (k: string): IconKey => {
  const map: Record<string, IconKey> = { personalcare: "personal" };
  const key = (k || "").toLowerCase();
  return (map[key] ?? key) as IconKey in Icons ? ((map[key] ?? key) as IconKey) : "brands";
};

export default function MobileCategoriesMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch("/api/mobile-cats", { cache: "no-store" });
        if (!r.ok) throw new Error("خطا در بارگذاری");
        const rows = (await r.json()) as Array<{ title:string; href:string; icon:string; order?:number }>;
        const mapped: Item[] = rows
          .sort((a,b)=>(a.order ?? 0) - (b.order ?? 0))
          .map(x => ({
            title: x.title,
            href: x.href,
            icon: normalizeIconKey(x.icon),
            order: x.order ?? 0,
          }));
        setItems(mapped);
      } catch (e:any) {
        setErr(e?.message || "مشکل در دریافت داده‌ها");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      {/* دکمه بازشدن */}
      <button onClick={() => setOpen(true)} className="sm:hidden border rounded px-3 py-2">
        دسته‌بندی‌ها
      </button>

      {/* مودال/شیت */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-2 top-6 bottom-6 sm:inset-y-10 sm:right-1/2 sm:translate-x-1/2
                          bg-white rounded-2xl shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">دسته‌بندی‌ها</h2>
              <button onClick={() => setOpen(false)} className="text-xl">×</button>
            </div>

            {/* وضعیت‌ها */}
            {loading && <div className="text-sm text-gray-500">در حال بارگذاری…</div>}
            {err && !loading && <div className="text-sm text-rose-600">{err}</div>}

            {!loading && !err && (
              items && items.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((c, i) => {
                    const Icon = Icons[c.icon];
                    return (
                      <Link
                        key={i}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="border rounded-xl p-3 flex items-center gap-3 hover:bg-gray-50"
                      >
                        <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gray-100">
                          <Icon className="w-6 h-6" />
                        </span>
                        <span className="text-sm">{c.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">آیتمی ثبت نشده است.</div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
