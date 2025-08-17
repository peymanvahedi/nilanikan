// src/components/HeaderDesktop.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../context/CartContext";

type Category = { id: string; name: string; slug?: string; parentId?: string | null };
type CatNode = Category & { children: CatNode[] };

type AdminHeader = {
  logoUrl?: string;
  logoAlt?: string;
  logoHeight?: string;       // px
  searchPlaceholder?: string;
  searchHeight?: string;     // px
  searchRounded?: string;    // tailwind class
  headerBg?: string;
  headerText?: string;
  sticky?: boolean;
  bannerText?: string;
};

const LS = {
  header: "admin.header",
  categories: "admin.categories",
} as const;

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
}

/* از آرایه‌ی تختِ دسته‌ها یک درخت می‌سازد */
function buildTree(cats: Category[]): CatNode[] {
  const map = new Map<string, CatNode>();
  const roots: CatNode[] = [];
  cats.forEach((c) => map.set(c.id, { ...c, children: [] }));

  map.forEach((n) => {
    const pid = n.parentId ?? null;
    if (pid && map.has(pid)) {
      map.get(pid)!.children.push(n);
    } else {
      roots.push(n);
    }
  });

  // مرتب‌سازی ساده بر اساس نام
  const sortRec = (arr: CatNode[]) => {
    arr.sort((a, b) => a.name.localeCompare(b.name, "fa"));
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export default function HeaderDesktop() {
  const [header, setHeader] = useState<AdminHeader>({
    logoHeight: "40",
    searchHeight: "36",
    searchPlaceholder: "جستجو...",
    searchRounded: "rounded-lg",
    headerBg: "#ffffff",
    headerText: "#111827",
    sticky: true,
    bannerText: "",
  });

  const [roots, setRoots] = useState<CatNode[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [barTop, setBarTop] = useState<number>(0);

  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // سبد خرید (فقط برای نمایش تعداد)
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((s, it) => s + (it.quantity || 0), 0);

  // لود تنظیمات و دسته‌ها از پنل ادمین (localStorage)
  useEffect(() => {
    const load = () => {
      try {
        const rawH = localStorage.getItem(LS.header);
        if (rawH) setHeader((p) => ({ ...p, ...(JSON.parse(rawH) as AdminHeader) }));
      } catch {}
      try {
        const rawC = localStorage.getItem(LS.categories);
        const list: Category[] = rawC ? JSON.parse(rawC) : [];
        setRoots(buildTree(list));
      } catch {}
    };
    load();
    const onStorage = () => load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const openAt = (idx: number) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    const el = itemRefs.current[idx];
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBarTop(r.bottom + 8);
    setOpenIdx(idx);
  };

  const delayedClose = () => {
    closeTimer.current = setTimeout(() => {
      setOpenIdx(null);
      closeTimer.current = null;
    }, 200);
  };

  /* لینک ساز ساده */
  const linkOf = (slug?: string) => (slug ? `/category/${slug}` : "#");

  return (
    <header
      className={`${header.sticky ? "sticky top-0" : ""} shadow z-[300] isolate`}
      style={{ backgroundColor: header.headerBg, color: header.headerText }}
    >
      {/* نوار اعلان بالای هدر (اختیاری) */}
      {header.bannerText ? (
        <div className="w-full bg-pink-600 text-white text-center py-2 text-sm">
          {header.bannerText}
        </div>
      ) : null}

      {/* ردیف بالا */}
      <div className="container mx-auto px-4 py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <a href="/" className="block">
          <img
            src={header.logoUrl || "/images/logo.png"}
            alt={header.logoAlt || "لوگو"}
            style={{ height: `${header.logoHeight}px` }}
            className="w-auto"
          />
        </a>

        <form action="/search" className="relative flex items-center w-full max-w-2xl">
          <input
            type="text"
            name="q"
            placeholder={header.searchPlaceholder || "جستجو..."}
            style={{ height: `${header.searchHeight}px` }}
            className={`w-full border border-gray-300 pr-12 pl-4 text-right placeholder-gray-500 focus:outline-none focus:border-pink-500 ${header.searchRounded || "rounded-lg"}`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM10 14a4 4 0 110-8 4 4 0 010 8z" />
            </svg>
          </div>
        </form>

        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="border border-pink-600 text-pink-600 rounded-lg px-4 py-2 hover:bg-pink-50"
          >
            ورود
          </a>

          {/* لینک سبد با نشان‌گر تعداد */}
          <a href="/cart" className="relative p-2 text-gray-800 hover:text-pink-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M5 6h13l-1.5 8H8L6 4H3" />
              <circle cx="8" cy="19" r="2" />
              <circle cx="17" cy="19" r="2" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1 -left-1 text-[10px] px-1.5 py-0.5 bg-pink-600 text-white rounded-full min-w-[18px] text-center leading-none">
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </div>

      {/* نوار اصلی */}
      <nav className="w-full bg-gray-900 text-white text-sm font-medium">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-6 h-11 overflow-x-auto no-scrollbar">
            {roots.map((root, idx) => {
              const hasChildren = root.children.length > 0;
              return (
                <li
                  key={root.id}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  className="relative"
                  onMouseEnter={() => hasChildren && openAt(idx)}
                  onMouseLeave={() => hasChildren && delayedClose()}
                >
                  <a href={linkOf(root.slug)} className="inline-flex items-center gap-2 py-3">
                    {root.name}
                    {hasChildren && (
                      <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z" />
                      </svg>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* مگامنو: ستون = فرزندِ روت، آیتم‌های هر ستون = نوه‌ها */}
      {openIdx !== null && roots[openIdx] && roots[openIdx].children.length > 0 && (
        <Portal>
          <div
            className="fixed inset-x-0 z-[9999] bg-white/95 backdrop-blur border-t border-gray-100 shadow-2xl"
            style={{ top: barTop }}
            onMouseLeave={delayedClose}
            onMouseEnter={() => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } }}
          >
            <div className="container mx-auto px-4 py-5">
              <div className="mb-4 flex items-center gap-2 text-pink-600 font-semibold text-sm">
                <span className="inline-block rotate-180">‹</span>
                <span>همه محصولات {roots[openIdx].name}</span>
              </div>

              <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {roots[openIdx].children.map((child, i, arr) => (
                  <div
                    key={child.id}
                    className={`space-y-3 pr-6 ${i !== arr.length - 1 ? "border-l" : ""}`}
                    style={{ borderColor: "#eee" }}
                  >
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="h-5 w-[2px] bg-pink-500 inline-block rounded" />
                      <a href={linkOf(child.slug)} className="hover:text-pink-600">{child.name}</a>
                    </h3>
                    <ul className="space-y-2 text-gray-700 leading-7">
                      {child.children.length === 0 ? (
                        <li className="text-gray-400">—</li>
                      ) : (
                        child.children.map((g) => (
                          <li key={g.id}>
                            <a href={linkOf(g.slug)} className="hover:text-pink-600 transition-colors">
                              {g.name}
                            </a>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </header>
  );
}
