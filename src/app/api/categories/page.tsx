"use client";
import { useEffect, useState } from "react";

type Category = { id: string; name: string; slug: string };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const res = await fetch("/api/categories", { cache: "no-store" });
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data?.error || "خطا در ثبت"); return; }
    setName(""); setSlug(""); setMsg("دسته ثبت شد");
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">مدیریت دسته‌بندی</h1>

      <form onSubmit={onSubmit} className="grid gap-3 max-w-md">
        <input className="border p-2 rounded" placeholder="نام دسته"
               value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2 rounded ltr" placeholder="اسلاگ (مثلاً shoes)"
               value={slug} onChange={e=>setSlug(e.target.value)} />
        <button disabled={loading} className="bg-black text-white rounded p-2">
          {loading ? "در حال ثبت..." : "افزودن دسته"}
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>

      <div className="border rounded">
        <div className="p-3 font-semibold">دسته‌ها</div>
        <ul className="divide-y">
          {items.map(it=>(
            <li key={it.id} className="p-3 flex items-center justify-between">
              <span>{it.name}</span>
              <code className="text-xs">{it.slug}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
