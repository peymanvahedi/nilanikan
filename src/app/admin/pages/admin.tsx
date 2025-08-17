"use client";
import React, { useEffect, useMemo, useState } from "react";

/* ===== انواع ===== */
type Cat = { id: string; name: string; slug: string; parentId?: string | null };
type Prod = {
  id: string; title: string; slug: string; price: number;
  priceBefore?: number | null; stock: number; images: string[]; categoryId?: string | null;
};

/* ===== کمک‌ها ===== */
const slugify = (s: string) =>
  s.trim()
   .replace(/\s+/g, "-")
   .replace(/[^\u0600-\u06FF\w-]/g, "")
   .toLowerCase();

export default function AdminDashboard() {
  /* ===== تنظیمات هدر (مثل قبل) ===== */
  const [logoHeight, setLogoHeight] = useState("40");
  const [searchHeight, setSearchHeight] = useState("36");
  const [bannerText, setBannerText] = useState("ارسال رایگان اولین خرید با کد: summer04");

  useEffect(() => {
    const saved = localStorage.getItem("headerSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      setLogoHeight(parsed.logoHeight || "40");
      setSearchHeight(parsed.searchHeight || "36");
      setBannerText(parsed.bannerText || "");
    }
  }, []);
  useEffect(() => {
    const settings = { logoHeight, searchHeight, bannerText };
    localStorage.setItem("headerSettings", JSON.stringify(settings));
    window.dispatchEvent(new Event("storage"));
  }, [logoHeight, searchHeight, bannerText]);

  /* ===== دسته‌بندی‌ها ===== */
  const [cats, setCats] = useState<Cat[]>([]);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catParent, setCatParent] = useState<string>("");

  const loadCats = async () => {
    const res = await fetch("/api/categories", { cache: "no-store" });
    const json = await res.json();
    setCats(json?.items || []);
  };
  useEffect(() => { loadCats(); }, []);

  const submitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return alert("نام و اسلاگ لازم است");
    const res = await fetch("/api/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, slug: catSlug, parentId: catParent || null }),
    });
    if (!res.ok) return alert("خطا در ساخت دسته");
    setCatName(""); setCatSlug(""); setCatParent("");
    loadCats();
  };

  /* ===== محصولات ===== */
  const [prods, setProds] = useState<Prod[]>([]);
  const [pTitle, setPTitle] = useState("");
  const [pSlug, setPSlug] = useState("");
  const [pPrice, setPPrice] = useState<number | "">("");
  const [pOld, setPOld] = useState<number | "">("");
  const [pStock, setPStock] = useState<number | "">(0);
  const [pCat, setPCat] = useState<string>("");
  const [pImage, setPImage] = useState<string>("");

  const loadProds = async () => {
    const res = await fetch("/api/products?limit=50", { cache: "no-store" });
    const json = await res.json();
    setProds(json?.items || []);
  };
  useEffect(() => { loadProds(); }, []);

  useEffect(() => { setPSlug(slugify(pTitle)); }, [pTitle]);

  const submitProd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle || !pSlug || !pPrice) return alert("عنوان، اسلاگ و قیمت لازم است");
    const res = await fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: pTitle,
        slug: pSlug,
        description: "",
        price: Number(pPrice),
        priceBefore: pOld === "" ? null : Number(pOld),
        stock: pStock === "" ? 0 : Number(pStock),
        images: pImage ? [pImage] : [],
        categoryId: pCat || null,
      }),
    });
    if (!res.ok) return alert("خطا در ساخت محصول");
    setPTitle(""); setPSlug(""); setPPrice(""); setPOld(""); setPStock(0); setPCat(""); setPImage("");
    loadProds();
  };

  const catsById = useMemo(() => Object.fromEntries(cats.map(c=>[c.id,c])), [cats]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-pink-600 border-b pb-3">🎛 پنل مدیریت</h1>

        {/* --- تنظیمات هدر --- */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <label className="block mb-1">ارتفاع لوگو (px)</label>
            <input type="number" value={logoHeight} onChange={e=>setLogoHeight(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block mb-1">ارتفاع جستجو (px)</label>
            <input type="number" value={searchHeight} onChange={e=>setSearchHeight(e.target.value)} className="border p-2 rounded w-full" />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label className="block mb-1">متن نوار تبلیغاتی</label>
            <input type="text" value={bannerText} onChange={e=>setBannerText(e.target.value)} className="border p-2 rounded w-full" />
          </div>
        </div>

        {/* --- دسته‌بندی‌ها --- */}
        <h2 className="text-xl font-bold mb-3">📂 دسته‌بندی‌ها</h2>
        <form onSubmit={submitCat} className="bg-gray-50 border rounded-lg p-4 mb-6 grid md:grid-cols-4 gap-3">
          <input className="border p-2 rounded" placeholder="نام دسته" value={catName} onChange={e=>{ setCatName(e.target.value); if(!catSlug) setCatSlug(slugify(e.target.value)); }} />
          <input className="border p-2 rounded ltr" placeholder="slug" value={catSlug} onChange={e=>setCatSlug(e.target.value)} />
          <select className="border p-2 rounded" value={catParent} onChange={e=>setCatParent(e.target.value)}>
            <option value="">— بدون والد —</option>
            {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="bg-pink-600 text-white rounded px-4">افزودن دسته</button>
        </form>
        <div className="grid md:grid-cols-3 gap-3 mb-10">
          {cats.map(c=>(
            <div key={c.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <code className="text-xs">{c.slug}</code>
              </div>
              {c.parentId && <span className="text-xs text-gray-500">والد: {catsById[c.parentId]?.name}</span>}
            </div>
          ))}
          {cats.length===0 && <div className="text-gray-500">هنوز دسته‌ای ساخته نشده.</div>}
        </div>

        {/* --- محصولات --- */}
        <h2 className="text-xl font-bold mb-3">🛍 افزودن محصول</h2>
        <form onSubmit={submitProd} className="bg-yellow-50 border rounded-lg p-4 mb-6 grid md:grid-cols-6 gap-3">
          <input className="border p-2 rounded md:col-span-2" placeholder="عنوان" value={pTitle} onChange={e=>setPTitle(e.target.value)} />
          <input className="border p-2 rounded ltr md:col-span-2" placeholder="slug" value={pSlug} onChange={e=>setPSlug(e.target.value)} />
          <input className="border p-2 rounded" type="number" placeholder="قیمت" value={pPrice} onChange={e=>setPPrice(e.target.value===""?"":Number(e.target.value))} />
          <input className="border p-2 rounded" type="number" placeholder="قیمت قبل" value={pOld} onChange={e=>setPOld(e.target.value===""?"":Number(e.target.value))} />
          <input className="border p-2 rounded md:col-span-2 ltr" placeholder="لینک تصویر (URL)" value={pImage} onChange={e=>setPImage(e.target.value)} />
          <select className="border p-2 rounded md:col-span-2" value={pCat} onChange={e=>setPCat(e.target.value)}>
            <option value="">— دسته —</option>
            {cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="border p-2 rounded" type="number" placeholder="موجودی" value={pStock} onChange={e=>setPStock(e.target.value===""?"":Number(e.target.value))} />
          <button className="bg-pink-600 text-white rounded px-4 md:col-span-1">افزودن</button>
        </form>

        <div className="space-y-3">
          {prods.length===0 ? <div className="text-gray-500">هنوز محصولی اضافه نشده.</div> :
            prods.map(p=>(
              <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <img src={p.images?.[0] || "/noimg.png"} alt={p.title} className="w-14 h-14 object-contain rounded" />
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-gray-500">{catsById[p.categoryId ?? ""]?.name || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">{p.price.toLocaleString("fa-IR")} <span className="text-xs">تومان</span></div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
