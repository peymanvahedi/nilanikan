"use client";

import { useEffect, useState } from "react";

/* ---- Types ---- */
type Category = { id: string; name: string };
type Product = {
  id: string; title: string; price: number; image: string;
  oldPrice?: number; brand?: string; categoryIds?: string[];
};

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function AdminData() {
  const [cats, setCats] = useState<Category[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [cName, setCName] = useState("");
  const [p, setP] = useState<{title:string;price:string;image:string;brand:string;oldPrice:string;catIds:Set<string>}>({
    title:"", price:"", image:"", brand:"", oldPrice:"", catIds:new Set()
  });

  const load = async () => {
    const [c, p] = await Promise.all([
      j<Category[]>("/api/categories"),
      j<Product[]>("/api/products"),
    ]);
    setCats(c); setProds(p);
  };

  useEffect(() => { load().catch(console.error); }, []);

  const addCat = async () => {
    if (!cName.trim()) return;
    await j("/api/categories", { method:"POST", body: JSON.stringify({ name: cName.trim() }) });
    setCName(""); await load();
  };
  const delCat = async (id:string) => { await j(`/api/categories/${id}`, { method:"DELETE" }); await load(); };

  const addProd = async () => {
    if (!p.title || !p.price || !p.image) return;
    await j("/api/products", {
      method:"POST",
      body: JSON.stringify({
        title: p.title,
        price: Number(p.price),
        image: p.image,
        brand: p.brand || undefined,
        oldPrice: p.oldPrice ? Number(p.oldPrice) : undefined,
        categoryIds: Array.from(p.catIds),
      }),
    });
    setP({ title:"", price:"", image:"", brand:"", oldPrice:"", catIds:new Set() });
    await load();
  };
  const delProd = async (id:string) => { await j(`/api/products/${id}`, { method:"DELETE" }); await load(); };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-8">
      <h1 className="text-xl font-bold">مدیریت داده (لوکال فایل)</h1>

      {/* دسته‌بندی */}
      <section className="bg-white border rounded-2xl p-4">
        <h2 className="font-semibold mb-3">دسته‌بندی‌ها</h2>
        <div className="flex gap-2 mb-4">
          <input value={cName} onChange={e=>setCName(e.target.value)} placeholder="نام دسته" className="border rounded px-3 py-2 flex-1"/>
          <button onClick={addCat} className="bg-pink-600 text-white rounded px-4">افزودن</button>
        </div>
        <ul className="space-y-2">
          {cats.map(c=>(
            <li key={c.id} className="flex items-center justify-between border rounded px-3 py-2">
              <span>{c.name}</span>
              <button onClick={()=>delCat(c.id)} className="text-red-600 text-sm">حذف</button>
            </li>
          ))}
        </ul>
      </section>

      {/* محصول */}
      <section className="bg-white border rounded-2xl p-4">
        <h2 className="font-semibold mb-3">محصول جدید</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="عنوان"
                 value={p.title} onChange={e=>setP({...p, title:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="قیمت (عدد)"
                 value={p.price} onChange={e=>setP({...p, price:e.target.value})}/>
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="آدرس تصویر اصلی"
                 value={p.image} onChange={e=>setP({...p, image:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="برند"
                 value={p.brand} onChange={e=>setP({...p, brand:e.target.value})}/>
          <input className="border rounded px-3 py-2" placeholder="قیمت قدیم (اختیاری)"
                 value={p.oldPrice} onChange={e=>setP({...p, oldPrice:e.target.value})}/>
        </div>

        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-1">انتخاب دسته‌ها:</div>
          <div className="flex flex-wrap gap-3">
            {cats.map(c=>(
              <label key={c.id} className="flex items-center gap-2 text-sm border rounded px-2 py-1">
                <input type="checkbox"
                       checked={p.catIds.has(c.id)}
                       onChange={e=>{
                         const s = new Set(p.catIds);
                         e.target.checked ? s.add(c.id) : s.delete(c.id);
                         setP({...p, catIds:s});
                       }}/>
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <button onClick={addProd} className="mt-4 bg-pink-600 text-white rounded px-4 py-2">افزودن محصول</button>
      </section>

      {/* لیست محصولات */}
      <section className="bg-white border rounded-2xl p-4">
        <h2 className="font-semibold mb-3">محصولات</h2>
        <ul className="space-y-2">
          {prods.map(pr=>(
            <li key={pr.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div className="flex items-center gap-3">
                <img src={pr.image} className="w-10 h-10 object-cover rounded border" alt=""/>
                <div>
                  <div className="font-medium">{pr.title}</div>
                  <div className="text-xs text-gray-500">قیمت: {pr.price.toLocaleString("fa-IR")} تومان</div>
                </div>
              </div>
              <button onClick={()=>delProd(pr.id)} className="text-red-600 text-sm">حذف</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
