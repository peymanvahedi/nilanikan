// src/app/admin/AdminDashboard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* ===== Types ===== */
type HeaderSettings = {
  logoUrl?: string;
  logoAlt?: string;
  logoHeight?: string;
  searchPlaceholder?: string;
  searchHeight?: string;
  searchRounded?: string;
  headerBg?: string;
  headerText?: string;
  sticky?: boolean;
};
type Slide = { id: string; desktop: string; mobile?: string; alt?: string; link?: string };
type AmazingProduct = { id: string; title: string; image: string; price: number; oldPrice?: number; url?: string };
type CatalogAttr = { key: string; value: string };
type CatalogProduct = {
  id: string; title: string; sku?: string; brand?: string;
  categoryIds: string[]; category?: string; price: number; oldPrice?: number;
  url?: string; image: string; gallery?: string[]; tags?: string[]; rating?: number; attrs?: CatalogAttr[];
};
type Category = { id: string; name: string; slug?: string; parentId?: string | null };
type Brand = { id: string; name: string };
type TabKey = "catalog" | "categories" | "amazing" | "slider" | "header";
type SaveState = "idle" | "saving" | "saved";

/* ===== API models (Catalog) ===== */
type DBProduct = {
  id: string;
  title: string;
  slug: string;
  price: number;
  priceBefore?: number | null;
  stock: number;
  sku?: string | null;
  brand?: Brand | null;
  category?: Category | null;
  images: any;
};
type ListResp = { items: DBProduct[]; page: number; pageSize: number; total: number; pages: number };

/* ===== localStorage keys ===== */
const LS = {
  header: "admin.header",
  slides: "admin.slides",
  amazing: "admin.amazing",
  categories: "admin.categories",
} as const;

/* helpers */
const readLS = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};
const writeLS = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
const slugify = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-\u0600-\u06FF]/g, "")
    .replace(/\-+/g, "-");
const offPercent = (price: number, old?: number | null) =>
  old && old > price ? Math.round((1 - price / old) * 100) : null;
const firstImage = (imgs: any): string => {
  if (Array.isArray(imgs) && imgs.length) {
    const v = imgs[0];
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && typeof v.url === "string") return v.url;
  }
  return "";
};

/* ===== Page ===== */
export default function AdminDashboard() {
  /* Tabs */
  const [active, setActive] = useState<TabKey>("catalog");
  const tabs: { key: TabKey; label: string }[] = [
    { key: "catalog", label: "📦 کاتالوگ محصولات" },
    { key: "categories", label: "🗂 دسته‌بندی‌ها" },
    { key: "amazing", label: "⚡ شگفت‌انگیزها" },
    { key: "slider", label: "🖼 اسلایدر بنری" },
    { key: "header", label: "🛠 تنظیمات سربرگ" },
  ];

  /* Local sections */
  const [header, setHeader] = useState<HeaderSettings>({
    logoUrl: "", logoAlt: "", logoHeight: "40",
    searchPlaceholder: "جستجو...", searchHeight: "36", searchRounded: "rounded-lg",
    headerBg: "#ffffff", headerText: "#111827", sticky: true,
  });
  const [slides, setSlides] = useState<Slide[]>([]);
  const [amazing, setAmazing] = useState<AmazingProduct[]>(readLS<AmazingProduct[]>(LS.amazing, []));
  const [categories, setCategories] = useState<Category[]>([]);
  const [catForm, setCatForm] = useState<Category>({ id: "", name: "", slug: "", parentId: null });

  /* Load once from LS */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHeader((p) => readLS(LS.header, p));
    setSlides((p) => readLS(LS.slides, p));
    setCategories((p) => readLS(LS.categories, p));
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) writeLS(LS.header, header); }, [header, hydrated]);
  useEffect(() => { if (hydrated) writeLS(LS.slides, slides); }, [slides, hydrated]);
  useEffect(() => { if (hydrated) writeLS(LS.amazing, amazing); }, [amazing, hydrated]);
  useEffect(() => { if (hydrated) writeLS(LS.categories, categories); }, [categories, hydrated]);

  /* Save bars */
  const [saveHeaderState, setSaveHeaderState] = useState<SaveState>("idle");
  const [saveSliderState, setSaveSliderState] = useState<SaveState>("idle");
  const [saveAmazingState, setSaveAmazingState] = useState<SaveState>("idle");
  const [saveCatsState, setSaveCatsState] = useState<SaveState>("idle");
  const fakeSave = async (s:React.Dispatch<React.SetStateAction<SaveState>>)=>{ s("saving"); await new Promise(r=>setTimeout(r,500)); s("saved"); setTimeout(()=>s("idle"),900); };
  const saveHeader = () => fakeSave(setSaveHeaderState);
  const saveSlider = () => fakeSave(setSaveSliderState);
  const saveAmazing = () => fakeSave(setSaveAmazingState);
  const saveCats = () => fakeSave(setSaveCatsState);

  const resetAll = () => {
    if (!confirm("همه‌ی داده‌های محلی پاک شود؟")) return;
    Object.values(LS).forEach((k)=>localStorage.removeItem(k));
    setSlides([]); setAmazing([]); setCategories([]);
    setHeader({ logoUrl:"", logoAlt:"", logoHeight:"40", searchPlaceholder:"جستجو...", searchHeight:"36", searchRounded:"rounded-lg", headerBg:"#ffffff", headerText:"#111827", sticky:true });
  };

  /* ===== Catalog (API) ===== */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbQ, setDbQ] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [list, setList] = useState<ListResp | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [errList, setErrList] = useState<string | null>(null);

  useEffect(() => {
    (async()=>{
      try{
        const [b,c] = await Promise.all([
          fetch("/api/brands").then(r=>r.json()).catch(()=>[]),
          fetch("/api/categories").then(r=>r.json()).catch(()=>[]),
        ]);
        setBrands(Array.isArray(b)?b:b.items??[]);
        setDbCategories(Array.isArray(c)?c:c.items??[]);
      }catch{}
    })();
  }, []);

  const qs = useMemo(()=> {
    const sp = new URLSearchParams();
    if (dbQ.trim()) sp.set("q", dbQ.trim());
    if (brandId) sp.set("brandId", brandId);
    if (categoryId) sp.set("categoryId", categoryId);
    sp.set("sort", sort);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp.toString();
  }, [dbQ, brandId, categoryId, sort, page, pageSize]);

  const loadProducts = async () => {
    setLoadingList(true); setErrList(null);
    try {
      const res = await fetch(`/api/products?${qs}`, { cache:"no-store" });
      const j = await res.json();
      if (!res.ok) {
        const errMsg = j?.error && j.error !== "(مثل قبل، تغییر نکرده)"
          ? j.error
          : "بارگیری ناموفق";
        throw new Error(errMsg);
      }
      setList(j);
    } catch (e:any) {
      setErrList(e?.message || "خطا");
    } finally { setLoadingList(false); }
  };
  useEffect(() => { if (active==="catalog") loadProducts(); /* eslint-disable-next-line */ }, [active, qs]);

  const removeProduct = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      const r = await fetch(`/api/products/${id}`, { method:"DELETE" });
      const j = await r.json().catch(()=>({}));
      if(!r.ok){
        if (j?.error && j.error !== "(مثل قبل، تغییر نکرده)") {
          alert(j.error);
        } else {
          alert("حذف ناموفق");
        }
        return;
      }
      const newCount=(list?.items?.length??1)-1;
      if(newCount<=0 && page>1) setPage(p=>p-1); else loadProducts();
    } catch {
      alert("خطا در حذف محصول");
    }
  };

  /* ===== Categories (API) ===== */
  const [catLoading, setCatLoading] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);

  const fetchCategories = async () => {
    setCatLoading(true); setCatErr(null);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "بارگیری دسته‌ها ناموفق");
      setCategories(Array.isArray(j) ? j : j.items ?? []);
    } catch (e: any) {
      setCatErr(e?.message || "خطا");
    } finally { setCatLoading(false); }
  };
  useEffect(() => { if (active === "categories") fetchCategories(); }, [active]);

  const saveCategory = async () => {
    const payload: Category = {
      id: catForm.id?.trim() || "",
      name: (catForm.name || "").trim(),
      slug: (catForm.slug || "").trim(),
      parentId: catForm.parentId || null,
    };
    if (!payload.name) return alert("نام دسته الزامی است");
    if (!payload.slug) payload.slug = slugify(payload.name);

    try {
      const isEdit = !!payload.id;
      const res = await fetch("/api/categories", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? payload : { name: payload.name, slug: payload.slug, parentId: payload.parentId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "ذخیره دسته ناموفق");

      if (isEdit) {
        setCategories((cs) => cs.map((c) => (c.id === payload.id ? j : c)));
      } else {
        setCategories((cs) => [...cs, j]);
      }
      setCatForm({ id: "", name: "", slug: "", parentId: null });
      alert("ذخیره شد ✅");
    } catch (e: any) {
      const msg = e?.message;
      if (msg && msg !== "(مثل قبل، تغییر نکرده)") alert(msg);
      else alert("ذخیره ناموفق");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "حذف ناموفق");
      setCategories((cs) => cs.filter((c) => c.id !== id));
    } catch (e: any) {
      const msg = e?.message;
      if (msg && msg !== "(مثل قبل، تغییر نکرده)") alert(msg);
      else alert("حذف ناموفق");
    }
  };

  /* ===== Amazing (Deals) ===== */
  const [searchQ, setSearchQ] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchRes, setSearchRes] = useState<DBProduct[]>([]);

  const doSearch = async () => {
    setSearchLoading(true); setSearchErr(null);
    try {
      const sp = new URLSearchParams();
      if (searchQ.trim()) sp.set("q", searchQ.trim());
      sp.set("page", "1");
      sp.set("pageSize", "10");
      const res = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "جستجو ناموفق");
      setSearchRes(Array.isArray(j.items) ? j.items : Array.isArray(j) ? j : []);
    } catch (e:any) {
      setSearchErr(e?.message || "خطا");
    } finally { setSearchLoading(false); }
  };

  const addFromProduct = (p: DBProduct) => {
    setAmazing((cur) => {
      if (cur.some((x) => x.id === p.id)) return cur;
      return [
        ...cur,
        {
          id: p.id,
          title: p.title,
          image: firstImage(p.images),
          price: p.price,
          oldPrice: p.priceBefore ?? undefined,
          url: `/product/${p.slug}`,
        },
      ];
    });
  };
  const updateAmazing = (id: string, patch: Partial<AmazingProduct>) =>
    setAmazing((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeAmazing = (id: string) =>
    setAmazing((cur) => cur.filter((x) => x.id !== id));
  const moveAmazing = (idx: number, dir: -1 | 1) =>
    setAmazing((cur) => {
      const a = [...cur];
      const j = idx + dir;
      if (j < 0 || j >= a.length) return a;
      [a[idx], a[j]] = [a[j], a[idx]];
      return a;
    });

  /* ===== Render ===== */
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        {/* Tabs + reset */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="flex items-center justify-between px-2">
            <div className="flex overflow-x-auto no-scrollbar">
              {tabs.map((t)=> <TabBtn key={t.key} label={t.label} active={active===t.key} onClick={()=>setActive(t.key)} />)}
            </div>
            <button onClick={resetAll} className="m-2 px-3 py-1 rounded bg-rose-100 text-rose-800 text-sm">
              پاک‌سازی داده‌های محلی
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ===== Catalog ===== */}
          {active==="catalog" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">کاتالوگ محصولات</h2>
                <button onClick={()=>loadProducts()} className="rounded bg-pink-600 text-white px-3 py-2 text-sm">↻ تازه‌سازی</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input className="border rounded p-2" placeholder="جستجو (عنوان/کد/توضیحات)" value={dbQ} onChange={(e)=>{ setPage(1); setDbQ(e.target.value); }}/>
                <select className="border rounded p-2" value={brandId} onChange={(e)=>{ setPage(1); setBrandId(e.target.value);} }>
                  <option value="">همه برندها</option>
                  {brands.map((b)=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select className="border rounded p-2" value={categoryId} onChange={(e)=>{ setPage(1); setCategoryId(e.target.value);} }>
                  <option value="">همه دسته‌ها</option>
                  {dbCategories.map((c)=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="border rounded p-2" value={sort} onChange={(e)=> setSort(e.target.value)}>
                  <option value="newest">جدیدترین</option>
                  <option value="priceAsc">ارزان‌ترین</option>
                  <option value="priceDesc">گران‌ترین</option>
                  <option value="stockAsc">کمترین موجودی</option>
                  <option value="stockDesc">بیشترین موجودی</option>
                </select>
                <select className="border rounded p-2" value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(Number(e.target.value)); }}>
                  {[10,20,50].map((s)=><option key={s} value={s}>{s} در صفحه</option>)}
                </select>
              </div>

              {/* جدول با دکمه ویرایش */}
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="p-2 text-right">عنوان</th>
                      <th className="p-2">برند</th>
                      <th className="p-2">دسته</th>
                      <th className="p-2">قیمت</th>
                      <th className="p-2">موجودی</th>
                      <th className="p-2">SKU</th>
                      <th className="p-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingList && <tr><td colSpan={7} className="p-4 text-center">در حال بارگذاری...</td></tr>}
                    {!loadingList && errList && <tr><td colSpan={7} className="p-4 text-center text-rose-600">{errList}</td></tr>}
                    {!loadingList && (list?.items?.length ?? 0)===0 && <tr><td colSpan={7} className="p-4 text-center">موردی یافت نشد</td></tr>}
                    {!loadingList && list?.items?.map((p)=>(  
                      <tr key={p.id} className="border-t">
                        <td className="p-2">
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-gray-500">{p.slug}</div>
                        </td>
                        <td className="p-2">{p.brand?.name ?? "-"}</td>
                        <td className="p-2">{p.category?.name ?? "-"}</td>
                        <td className="p-2">{p.price?.toLocaleString?.("fa-IR")}</td>
                        <td className="p-2">{p.stock}</td>
                        <td className="p-2">{p.sku ?? "-"}</td>
                        <td className="p-2 flex gap-2">
                          <Link
                            href={`/admin/products/${encodeURIComponent(p.id)}`}
                            className="px-2 py-1 rounded bg-blue-600 text-white"
                          >
                            ویرایش
                          </Link>
                          <button
                            className="px-2 py-1 rounded bg-red-600 text-white"
                            onClick={()=> removeProduct(p.id)}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {list && list.pages>1 && (
                <div className="flex items-center gap-2">
                  <button className="border rounded px-3 py-1" disabled={page<=1} onClick={()=> setPage(p=>Math.max(1,p-1))}>قبلی</button>
                  <div className="text-sm">صفحه {list.page} از {list.pages}</div>
                  <button className="border rounded px-3 py-1" disabled={page>=list.pages} onClick={()=> setPage(p=>Math.min(list.pages,p+1))}>بعدی</button>
                </div>
              )}
            </>
          )}

          {/* ===== Categories ===== */}
          {active === "categories" && (
            <div className="space-y-4">
              <div className="flex items-center justify_between">
                <h2 className="text-lg font-bold">مدیریت دسته‌بندی‌ها</h2>
                <button onClick={fetchCategories} className="rounded bg-pink-600 text-white px-3 py-2 text-sm">↻ تازه‌سازی</button>
              </div>

              {catErr && (
                <div className="text-rose-600 border border-rose-200 bg-rose-50 rounded p-2 text-sm">
                  {catErr !== "(مثل قبل، تغییر نکرده)" ? catErr : "خطا"}
                </div>
              )}

              <div className="border rounded p-4 space-y-3">
                <div className="grid md:grid-cols-3 gap-3">
                  <input className="border rounded p-2 w-full" placeholder="نام دسته" value={catForm.name || ""} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}/>
                  <input className="border rounded p-2 w-full" placeholder="اسلاگ (خالی بماند تا خودکار شود)" value={catForm.slug || ""} onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))}/>
                  <select className="border rounded p-2 w-full" value={catForm.parentId ?? ""} onChange={(e) => setCatForm((f) => ({ ...f, parentId: e.target.value || null }))}>
                    <option value="">— بدون والد —</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveCategory} className="px-4 py-2 rounded bg-emerald-600 text-white">{catForm.id ? "ذخیره تغییرات" : "افزودن"}</button>
                  <button onClick={() => setCatForm({ id: "", name: "", slug: "", parentId: null })} className="px-4 py-2 rounded bg-gray-200">جدید</button>
                </div>
              </div>

              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-right">نام</th>
                      <th className="p-2 text-right">اسلاگ</th>
                      <th className="p-2 text-right">والد</th>
                      <th className="p-2">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catLoading && (<tr><td colSpan={4} className="p-4 text-center">در حال بارگذاری...</td></tr>)}
                    {!catLoading && categories.length === 0 && (<tr><td colSpan={4} className="p-4 text-center">هیچ دسته‌ای موجود نیست</td></tr>)}
                    {!catLoading && categories.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-2">{c.name}</td>
                        <td className="p-2">{c.slug}</td>
                        <td className="p-2">{c.parentId ? categories.find((x) => x.id === c.parentId)?.name ?? "-" : "-"}</td>
                        <td className="p-2 flex gap-2">
                          <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={() => setCatForm(c)}>ویرایش</button>
                          <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => deleteCategory(c.id)}>حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== Amazing ===== */}
          {active==="amazing" && (
            <>
              <SaveBar onSave={saveAmazing} state={saveAmazingState} />
              <Section title="شگفت‌انگیزها" tone="yellow">
                {/* جستجو و افزودن از محصولات */}
                <div className="border rounded-lg p-3 space-y-3 bg-white">
                  <div className="flex gap-2">
                    <input className="border rounded p-2 flex-1" placeholder="جستجو بین محصولات (عنوان/کد/توضیحات)" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()}/>
                    <button onClick={doSearch} className="px-3 py-2 rounded bg-blue-600 text-white">جستجو</button>
                  </div>
                  {searchErr && <div className="text-sm text-rose-600">{searchErr}</div>}
                  {searchLoading ? (
                    <div className="text-sm text-gray-500">در حال جستجو…</div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-2">
                      {searchRes.map((p) => (
                        <div key={p.id} className="flex items-center justify-between border rounded p-2">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={firstImage(p.images) || "/placeholder.png"} alt="" className="w-12 h-12 object-cover rounded" />
                            <div>
                              <div className="text-sm font-medium">{p.title}</div>
                              <div className="text-xs text-gray-500">{p.price?.toLocaleString?.("fa-IR")} تومان</div>
                            </div>
                          </div>
                          <button onClick={() => addFromProduct(p)} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">افزودن</button>
                        </div>
                      ))}
                      {searchRes.length === 0 && !searchLoading && (<div className="text-xs text-gray-500">نتیجه‌ای نمایش داده نشد.</div>)}
                    </div>
                  )}
                </div>

                {/* لیست شگفت‌انگیزها */}
                <div className="space-y-2 mt-4">
                  {amazing.map((a, i) => {
                    const off = offPercent(a.price, a.oldPrice);
                    return (
                      <div key={a.id} className="grid md:grid-cols-6 gap-2 bg-white p-2 border rounded-lg items-center">
                        <div className="flex items-center gap-2 md:col-span-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.image || "/placeholder.png"} alt="" className="w-14 h-14 object-cover rounded" />
                          <input className="border rounded p-2 w-full" value={a.title} onChange={(e) => updateAmazing(a.id, { title: e.target.value })}/>
                        </div>
                        <input className="border rounded p-2" placeholder="تصویر" value={a.image} onChange={(e) => updateAmazing(a.id, { image: e.target.value })}/>
                        <input className="border rounded p-2" placeholder="قیمت" type="number" value={a.price} onChange={(e) => updateAmazing(a.id, { price: Number(e.target.value || 0) })}/>
                        <input className="border rounded p-2" placeholder="قیمت قبل" type="number" value={a.oldPrice ?? ""} onChange={(e) => updateAmazing(a.id, { oldPrice: e.target.value ? Number(e.target.value) : undefined })}/>
                        <input className="border rounded p-2" placeholder="لینک" value={a.url ?? ""} onChange={(e) => updateAmazing(a.id, { url: e.target.value })}/>
                        <div className="flex items-center gap-2 justify-end md:col-span-6">
                          {off !== null && <span className="text-xs text-rose-600">٪{off} تخفیف</span>}
                          {a.url && (
                            <a href={a.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded bg-gray-800 text-white text-sm">
                              مشاهده
                            </a>
                          )}
                          <button onClick={() => moveAmazing(i, -1)} className="px-2 py-1 rounded bg-gray-200 text-sm">بالا</button>
                          <button onClick={() => moveAmazing(i, 1)} className="px-2 py-1 rounded bg-gray-200 text-sm">پایین</button>
                          <button onClick={() => removeAmazing(a.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-sm">حذف</button>
                        </div>
                      </div>
                    );
                  })}
                  {amazing.length === 0 && <div className="text-sm text-gray-500">هنوز موردی اضافه نشده.</div>}
                </div>
              </Section>
            </>
          )}

          {/* ===== Slider ===== */}
          {active==="slider" && (
            <Section title="اسلایدر بنری" tone="blue">
              <div className="text-sm text-gray-600">این بخش به‌زودی تکمیل می‌شود.</div>
            </Section>
          )}

          {/* ===== Header ===== */}
          {active==="header" && (
            <>
              <SaveBar onSave={saveHeader} state={saveHeaderState} />
              <Section title="تنظیمات سربرگ" tone="pink">
                <div className="grid md:grid-cols-3 gap-3">
                  <Input label="Logo URL" value={header.logoUrl||""} onChange={(v)=> setHeader((s)=>({...s,logoUrl:v}))}/>
                  <Input label="Logo Alt" value={header.logoAlt||""} onChange={(v)=> setHeader((s)=>({...s,logoAlt:v}))}/>
                  <Input label="Logo Height" value={header.logoHeight||""} onChange={(v)=> setHeader((s)=>({...s,logoHeight:v}))}/>
                  <Input label="Placeholder جستجو" value={header.searchPlaceholder||""} onChange={(v)=> setHeader((s)=>({...s,searchPlaceholder:v}))}/>
                  <Input label="Search Height" value={header.searchHeight||""} onChange={(v)=> setHeader((s)=>({...s,searchHeight:v}))}/>
                  <Input label="Rounded کلاس" value={header.searchRounded||""} onChange={(v)=> setHeader((s)=>({...s,searchRounded:v}))}/>
                  <Input label="پس‌زمینه هدر" value={header.headerBg||""} onChange={(v)=> setHeader((s)=>({...s,headerBg:v}))}/>
                  <Input label="رنگ متن هدر" value={header.headerText||""} onChange={(v)=> setHeader((s)=>({...s,headerText:v}))}/>
                  <div>
                    <label className="block text-sm mb-1">Sticky</label>
                    <input type="checkbox" checked={!!header.sticky} onChange={(e)=> setHeader((s)=>({...s,sticky:e.target.checked}))}/>
                  </div>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Small UI helpers ===== */
function SaveBar({ onSave, state }: { onSave: () => void; state: SaveState }) {
  return (
    <div className="sticky top-14 z-10 bg-white/80 backdrop-blur border rounded-lg p-3 mb-4 flex items-center justify-between">
      <div className="text-sm text-gray-500">{state==="idle"?"آماده ذخیره":state==="saving"?"در حال ذخیره...":"ذخیره شد ✅"}</div>
      <button onClick={onSave} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60" disabled={state==="saving"}>ذخیره</button>
    </div>
  );
}
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className={`px-4 sm:px-5 py-3 text-sm sm:text-base border-b-2 transition ${active ? "border-pink-600 text-pink-600 font-semibold" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
      {label}
    </button>
  );
}
function Section({ title, tone, children }: { title: string; tone: "pink"|"blue"|"green"|"yellow"; children: React.ReactNode }) {
  const map = {
    pink: "bg-pink-50 border-pink-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
  } as const;

  return (
    <div className={`p-4 rounded-lg border ${map[tone]} space-y-3`}>
      <h3 className="font-bold">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
function Input({ label, value, onChange, type="text", placeholder }: { label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input className="border p-2 rounded w-full" value={value} onChange={(e)=>onChange(e.target.value)} type={type} placeholder={placeholder}/>
    </div>
  );
}
