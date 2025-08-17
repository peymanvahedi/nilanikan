"use client";

import { useEffect, useMemo, useState } from "react";

type IconKey =
  | "brands" | "special" | "skincare" | "makeup" | "personalcare" | "hair"
  | "electric" | "perfume" | "fashion" | "supplement" | "digital" | "jewelry" | "magazine";

type Row = { id?: string; title: string; href: string; icon: IconKey; order?: number };

const ALL_ICONS: IconKey[] = [
  "brands","special","skincare","makeup","personalcare","hair",
  "electric","perfume","fashion","supplement","digital","jewelry","magazine",
];

export default function MobileCatsAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/mobile-cats", { cache: "no-store" });
        const json = await r.json();
        setRows(Array.isArray(json) ? json : []);
      } catch {
        setErr("خطا در خواندن داده‌ها");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addRow = () =>
    setRows((x) => [...x, { title: "", href: "/", icon: "brands", order: x.length }]);

  const removeRow = (i: number) =>
    setRows((x) => x.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, order: idx })));

  const move = (i: number, dir: -1 | 1) =>
    setRows((x) => {
      const y = [...x];
      const j = i + dir;
      if (j < 0 || j >= y.length) return x;
      [y[i], y[j]] = [y[j], y[i]];
      return y.map((r, k) => ({ ...r, order: k }));
    });

  const change = (i: number, patch: Partial<Row>) =>
    setRows((x) => x.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const valid = useMemo(
    () => rows.every((r) => r.title?.trim() && r.href?.trim() && ALL_ICONS.includes(r.icon)),
    [rows]
  );

  const save = async () => {
    setSaving(true); setErr(null); setMsg(null);
    try {
      const r = await fetch("/api/mobile-cats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows.map((r, i) => ({ ...r, order: i }))),
      });
      const j = await r.json().catch(()=> ({}));
      if (!r.ok) throw new Error(j?.error || "خطا در ذخیره‌سازی");
      setRows(Array.isArray(j) ? j : rows);
      setMsg("ذخیره شد ✅");
    } catch (e:any) {
      setErr(e.message || "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-lg font-bold">مدیریت منوی موبایل</h1>

      <div className="flex gap-2">
        <button onClick={addRow} className="px-3 py-2 rounded border">افزودن آیتم</button>
        <button onClick={save} disabled={!valid || saving} className={`px-4 py-2 rounded ${valid && !saving ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-500"}`}>
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
      </div>

      {err && <div className="p-3 bg-rose-50 text-rose-700 rounded">{err}</div>}
      {msg && <div className="p-3 bg-emerالد-50 text-emerald-700 rounded">{msg}</div>}

      {loading ? (
        <div className="text-gray-500">در حال بارگذاری…</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white">
              <div className="sm:col-span-4">
                <label className="block text-xs mb-1">عنوان</label>
                <input className="w-full border rounded px-2 py-2" value={r.title} onChange={(e)=>change(i,{title:e.target.value})}/>
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs mb-1">لینک</label>
                <input className="w-full border rounded px-2 py-2 ltr:text-left" value={r.href} onChange={(e)=>change(i,{href:e.target.value})} placeholder="/c/slug یا /mag"/>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs mb-1">آیکن</label>
                <select className="w-full border rounded px-2 py-2" value={r.icon} onChange={(e)=>change(i,{icon:e.target.value as IconKey})}>
                  {ALL_ICONS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="sm:col-span-12 flex gap-2">
                <button onClick={()=>move(i,-1)} className="px-3 py-2 rounded border">بالا</button>
                <button onClick={()=>move(i, 1)} className="px-3 py-2 rounded border">پایین</button>
                <button onClick={()=>removeRow(i)} className="px-3 py-2 rounded border text-rose-600">حذف</button>
              </div>
            </div>
          ))}
          {rows.length===0 && <div className="text-sm text-gray-500">آیتمی ثبت نشده.</div>}
        </div>
      )}
    </main>
  );
}
