
// src/components/HeaderMobile.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ---------- Types ---------- */
type Settings = { logoHeight: string; searchHeight: string; bannerText: string };
type CatNode = { id: string; name: string; slug: string; children?: CatNode[] };
type ApiMobileCat = { title: string; href: string; icon: string; order: number };
type ApiClearanceItem = {
  title: string;
  href: string;
  image?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  order?: number | null;
};

/* ---------- Icons ---------- */
const UiIcons = {
  brands: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M4 6h16M4 12h10M4 18h7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  special: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.6-4.9-2.6-4.9 2.6.9-5.6-4-3.9 5.5-.8L12 3z" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  skincare: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="6" y="7" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  makeup: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M6 20l5-5M3 21l3-1 8-8-2-2-8 8-1 3zM15 3l6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  personal: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M8 3h8v4H8zM10 7v14m4-14v14" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  hair: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M8 4c2-2 6-2 8 0 2 2 2 6 0 8l-4 4-4-4C6 10 6 6 8 4z" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  electric: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M13 2 3 14h7l-1 8 11-12h-7l1-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  ),
  perfume: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="6" y="8" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M10 8V5h4v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  fashion: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M8 6h8l3 6-5 8H10L5 12l3-6z" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  supplement: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="4" y="3" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="7" y="15" width="10" height="6" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  digital: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 21h8" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  jewelry: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <circle cx="12" cy="13" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9 5 12 3l3 2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  magazine: (p: any) => (
    <svg viewBox="0 0 24 24" {...p}>
      <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
} as const;
type IconKey = keyof typeof UiIcons;

/* ---------- Component ---------- */
export default function HeaderMobile() {
  const [settings, setSettings] = useState<Settings>({ logoHeight: "36", searchHeight: "40", bannerText: "" });

  const [open, setOpen] = useState(false);
  const [panelCat, setPanelCat] = useState<CatNode | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [errorTree, setErrorTree] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  type CatCard = { id: string; title: string; href: string; icon: IconKey; slug?: string };
  const [catsFromApi, setCatsFromApi] = useState<CatCard[] | null>(null);

  const [clearance, setClearance] = useState<ApiClearanceItem[] | null>(null);

  const tabs = [
    { key: "cats", title: "دسته‌بندی‌ها" },
    { key: "clearance", title: "حراج تک‌سایزها" },
    { key: "offers", title: "پیشنهاد ویژه" },
  ] as const;
  type TabKey = typeof tabs[number]["key"];

  // Hydration-safe tab restore
  const [activeTab, setActiveTab] = useState<TabKey>("cats");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hm_tab") as TabKey | null;
      if (saved === "cats" || saved === "clearance" || saved === "offers") setActiveTab(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("hm_tab", activeTab);
    } catch {}
  }, [activeTab]);

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // settings from LS
  useEffect(() => {
    try {
      const h = localStorage.getItem("headerSettings");
      if (h) {
        const p = JSON.parse(h);
        setSettings({
          logoHeight: String(p.logoHeight ?? "36"),
          searchHeight: String(p.searchHeight ?? "40"),
          bannerText: String(p.bannerText ?? ""),
        });
      }
    } catch {}
  }, []);

  // helpers
  const normalizeIcon = (k: string): IconKey => {
    const map: Record<string, IconKey> = { personalcare: "personal" };
    const kk = (k || "").toLowerCase();
    const key = (map[kk] ?? kk) as IconKey;
    return key in UiIcons ? key : "brands";
  };

  // data loaders
  async function loadMobileCats() {
    try {
      const r = await fetch("/api/mobile-cats", { cache: "no-store" });
      if (!r.ok) return setCatsFromApi([]);
      const rows = (await r.json()) as ApiMobileCat[];
      const mapped: CatCard[] = (Array.isArray(rows) ? rows : [])
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((x, i) => ({
          id: String(i + 1),
          title: x.title,
          href: x.href,
          icon: normalizeIcon(x.icon),
          slug: x.href.split("/").filter(Boolean).pop() || "",
        }));
      setCatsFromApi(mapped);
    } catch {
      setCatsFromApi([]);
    }
  }

  async function loadClearance() {
    try {
      const r = await fetch("/api/mobile-clearance", { cache: "no-store" });
      if (!r.ok) return setClearance([]);
      const rows = (await r.json()) as ApiClearanceItem[];
      setClearance((Array.isArray(rows) ? rows : []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch {
      setClearance([]);
    }
  }

  useEffect(() => {
    loadMobileCats();
    loadClearance();
  }, []);

  // category tree
  async function loadCategoryTreeBySlug(slug?: string, title?: string) {
    if (!slug) return setPanelCat(null);
    setLoadingTree(true);
    setErrorTree(null);
    try {
      let r = await fetch(`/api/categories/tree?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      let data: any = r.ok ? await r.json() : null;

      if (!data || (Array.isArray(data) && !data.length)) {
        r = await fetch(`/api/categories?parent=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (r.ok) {
          const arr = (await r.json()) as any[];
          data = {
            id: slug,
            name: title || "",
            slug,
            children: arr?.map((x) => ({ id: x.id || x.slug, name: x.name, slug: x.slug })) ?? [],
          };
        }
      }

      if (!data || (Array.isArray(data) && !data.length)) {
        r = await fetch(`/api/categories/${encodeURIComponent(slug)}/children`, { cache: "no-store" });
        if (r.ok) {
          const arr = (await r.json()) as any[];
          data = {
            id: slug,
            name: title || "",
            slug,
            children:
              arr?.map((x) => ({
                id: x.id || x.slug,
                name: x.name,
                slug: x.slug,
                children: x.children,
              })) ?? [],
          };
        }
      }

      const root: CatNode = Array.isArray(data)
        ? { id: slug, name: title || "", slug, children: data }
        : (data as CatNode);

      setPanelCat(root || { id: slug, name: title || "", slug, children: [] });
      setExpanded({});
    } catch {
      setErrorTree("خطا در خواندن زیرشاخه‌ها");
      setPanelCat({ id: slug, name: title || "", slug, children: [] });
    } finally {
      setLoadingTree(false);
    }
  }

  // open/close
  const onOpenMenu = async () => {
    await Promise.all([loadMobileCats(), loadClearance()]);
    setPanelCat(null);
    setOpen(true);
  };
  const closeAndFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const source = catsFromApi ?? [];

  return (
    <header className="bg-white z-[300] sticky top-0 md:hidden">
      {settings.bannerText ? <div className="bg-pink-600 text-white text-center text-xs py-2">{settings.bannerText}</div> : null}

      <div className="flex items-center justify-between px-3 py-2 shadow">
        <button ref={triggerRef} aria-label="دسته‌بندی‌ها" onClick={onOpenMenu} className="p-2">🗂</button>
        <Link href="/" className="block">
          <img src="/images/logo.png" alt="لوگو" style={{ height: `${settings.logoHeight}px` }} className="w-auto" />
        </Link>
        <Link href="/cart" className="p-2" aria-label="سبد">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 6h13l-1.5 8H8L6 4H3" /><circle cx="8" cy="19" r="2" /><circle cx="17" cy="19" r="2" />
          </svg>
        </Link>
      </div>

      <form action="/search" className="px-3 py-2 border-b">
        <div className="relative">
          <input
            type="text"
            name="q"
            placeholder="جست‌وجو در محصولات…"
            style={{ height: `${settings.searchHeight}px` }}
            className="w-full rounded-lg border border-gray-300 pr-10 pl-3 text-right placeholder-gray-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM10 14a4 4 0 110-8 4 4 0 010 8z" />
            </svg>
          </span>
        </div>
      </form>

      {/* Drawer */}
      <div className={`${open ? "pointer-events-auto" : "pointer-events-none"} md:hidden`}>
        <div onClick={closeAndFocus} className={`fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="منوی موبایل"
          className={`fixed inset-y-0 right-0 z-[9999] w-full max-w-[420px] bg-white shadow-xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-4 border-b">
            {panelCat ? (
              <div className="flex items-center justify-between">
                <button onClick={() => setPanelCat(null)} className="p-1" aria-label="برگشت">❮</button>
                <div className="font-bold">{panelCat.name || "دسته‌بندی"}</div>
                <button onClick={closeAndFocus} className="p-1" aria-label="بستن">✕</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="opacity-0">•</span>
                  <div className="font-bold">منوی خانومی</div>
                  <button onClick={closeAndFocus} className="p-1" aria-label="بستن">✕</button>
                </div>
                <nav className="mt-3">
                  <ul className="flex gap-2 overflow-x-auto">
                    {tabs.map((t) => (
                      <li key={t.key}>
                        <button
                          onClick={() => setActiveTab(t.key as TabKey)}
                          className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${activeTab === t.key ? "bg-pink-600 text-white border-pink-600" : "bg-white text-gray-700 border-gray-300"}`}
                        >
                          {t.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </>
            )}
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {/* تب دسته‌ها (بدون میان‌برها) */}
            {activeTab === "cats" && !panelCat && (
              <div className="space-y-5">
                {source.length ? (
                  <div>
                    <h3 className="mb-2 text-sm font-bold">همه دسته‌بندی‌ها</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {source.map((c) => {
                        const Icon = UiIcons[c.icon];
                        return (
                          <button
                            key={c.id}
                            className="border rounded-xl p-3 h-16 flex items-center gap-3 hover:bg-gray-50 text-right"
                            onClick={() => loadCategoryTreeBySlug(c.slug, c.title)}
                          >
                            <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gray-50">
                              <Icon className="w-6 h-6" />
                            </span>
                            <span className="text-sm whitespace-nowrap">{c.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">آیتمی ثبت نشده.</div>
                )}
              </div>
            )}

            {/* تب حراج تک‌سایزها */}
            {activeTab === "clearance" && !panelCat && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">حراج تک‌سایزها</h3>
                  <Link href="/clearance" onClick={closeAndFocus} className="text-pink-600 text-xs font-semibold hover:underline">
                    مشاهده همه
                  </Link>
                </div>

                {clearance === null ? (
                  <div className="text-gray-500 text-sm">در حال بارگذاری…</div>
                ) : clearance.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {clearance.map((it, i) => (
                      <Link key={i} href={it.href} onClick={closeAndFocus} className="border rounded-xl p-2 bg-white">
                        {it.image ? <img src={it.image} alt={it.title} className="w-full h-24 object-contain rounded" /> : null}
                        <div className="mt-2 text-xs line-clamp-2 text-right">{it.title}</div>
                        {(it.price != null || it.oldPrice != null) && (
                          <div className="mt-1 flex items-center gap-2">
                            {it.price != null && <span className="text-sm font-bold text-gray-900">{it.price.toLocaleString("fa-IR")} تومان</span>}
                            {it.oldPrice != null && <span className="text-xs text-gray-400 line-through">{it.oldPrice.toLocaleString("fa-IR")}</span>}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">آیتمی ثبت نشده.</div>
                )}
              </div>
            )}

            {/* تب پیشنهاد ویژه (placeholder) */}
            {activeTab === "offers" && !panelCat && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">پیشنهادهای روز</h3>
                  <Link href="/offers" onClick={closeAndFocus} className="text-pink-600 text-xs font-semibold hover:underline">
                    مشاهده همه
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Link key={i} href={`/offers/o${i}`} onClick={closeAndFocus} className="h-20 border rounded-xl p-3 flex items-center justify-center text-sm bg-white">
                      پیشنهاد {i + 1}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* درخت زیرشاخه‌ها */}
            {panelCat && (
              <div>
                <div className="mb-3">
                  <Link href={`/categories/${panelCat.slug}`} className="text-sm font-semibold text-pink-600 hover:underline" onClick={closeAndFocus}>
                    همه محصولات {panelCat.name}
                  </Link>
                </div>

                {loadingTree && <div className="py-8 text-center text-gray-500 text-sm">در حال بارگذاری…</div>}
                {errorTree && <div className="mb-3 text-rose-600 text-sm">{errorTree}</div>}

                <ul className="divide-y">
                  {(panelCat.children || []).map((child) => {
                    const isOpen = !!expanded[child.slug];
                    const toggle = () => setExpanded((e) => ({ ...e, [child.slug]: !e[child.slug] }));
                    const hasKids = (child.children || []).length > 0;

                    return (
                      <li key={child.slug} className="py-2">
                        <div className="flex items-center justify-between">
                          {hasKids ? (
                            <button className="py-2 text-right font-medium" onClick={toggle}>{child.name}</button>
                          ) : (
                            <Link href={`/categories/${child.slug}`} className="py-2 text-right font-medium" onClick={closeAndFocus}>{child.name}</Link>
                          )}
                          <div className="pl-2">
                            {hasKids ? (
                              <button className={`transition-transform ${isOpen ? "rotate-180" : ""}`} onClick={toggle} aria-label="باز و بسته">⌄</button>
                            ) : <span className="opacity-0">•</span>}
                          </div>
                        </div>

                        {hasKids && isOpen && (
                          <div className="mt-2 pr-2">
                            <div className="flex flex-wrap gap-2">
                              {child.children!.map((leaf) => (
                                <Link key={leaf.slug} href={`/categories/${leaf.slug}`} className="text-xs px-2 py-1 rounded border bg-gray-50" onClick={closeAndFocus}>
                                  {leaf.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {(panelCat.children || []).length === 0 && !loadingTree && <div className="text-sm text-gray-500">زیرشاخه‌ای ثبت نشده.</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-[200] bg-white border-t md:hidden">
        <ul className="grid grid-cols-4 text-xs">
          <li><Link href="/" className="flex flex-col items-center py-2">🏠<span>خانه</span></Link></li>
          <li><button onClick={onOpenMenu} className="w-full flex flex-col items-center py-2">🗂<span>دسته‌ها</span></button></li>
          <li><Link href="/cart" className="flex flex-col items-center py-2">🛒<span>سبد</span></Link></li>
          <li><Link href="/account" className="flex flex-col items-center py-2">👤<span>حساب</span></Link></li>
        </ul>
      </nav>

      <div className="h-12 md:hidden" />
    </header>
  );
}
