"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { id?: string; title: string; href: string; image?: string; price?: number | null; oldPrice?: number | null; order?: number };

export default function MobileClearanceAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/mobile-clearance", { cache: "no-store" });
        const j = await r.json();
        setRows(Array.isArray(j) ? j : []);
      } catch {
        setErr("خطا در خواندن داده‌ها");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const add = () => setRows((x) => [...x, { title: "", href: "/", image: "", price: null, oldPrice: null, order: x.length }]);
  const del = (i: number) => setRows((x) => x.filter((_, k) => k !== i).map((r, k) => ({ ...r, order: k })));
  const mv = (i: number, d: -1 | 1) =>
    setRows((x) => {
      const y = [...x];
      const j = i + d;
      if (j < 0 || j >= y.length) return x;
      [y[i], y[j]] = [y[j], y[i]];
      return y.map((r, k) => ({ ...r, order: k }));
    });
  const ch = (i: number, p: Partial<Row>) => setRows((x) => x.map((r, k) => (k === i ? { ...r, ...p } : r)));

  const valid = useMemo(() => rows.every((r) => r.title?.trim() && r.href?.trim()), [rows]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await fetch("/api/mobile-clearance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rows.map((r, i) => ({ ...r, order: i }))),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "خطا در ذخیره‌سازی");
      setRows(Array.isArray(j) ? j : rows);
      setMsg("ذخیره شد ✅");
    } catch (e: any) {
      setErr(e.message || "خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-lg font-bold">مدیریت حراج تک‌سایزها (تب موبایل)</h1>
      <div className="flex gap-2">
        <button onClick={add} className="px-3 py-2 rounded border">افزودن آیتم</button>
        <button onClick={save} disabled={!valid || saving} className={`px-4 py-2 rounded ${valid && !saving ? "bg-pink-600 text-white" : "bg-gray-200 text-gray-500"}`}>
          {saving ? "در حال ذخیره…" : "ذخیره"}
        </button>
      </div>

      {err && <div className="p-3 bg-rose-50 text-rose-700 rounded">{err}</div>}
      {msg && <div className="p-3 bg-emerald-50 text-emerald-700 rounded">{msg}</div>}

      {loading ? (
        <div className="text-gray-500">در حال بارگذاری…</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-white">
              <div className="sm:col-span-4">
                <label className="block text-xs mb-1">عنوان</label>
                <input className="w-full border rounded px-2 py-2" value={r.title} onChange={(e) => ch(i, { title: e.target.value })} />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs mb-1">لینک</label>
                <input className="w-full border rounded px-2 py-2 ltr:text-left" value={r.href} onChange={(e) => ch(i, { href: e.target.value })} placeholder="/sale/..." />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs mb-1">تصویر (اختیاری)</label>
                <input className="w-full border rounded px-2 py-2 ltr:text-left" value={r.image || ""} onChange={(e) => ch(i, { image: e.target.value })} placeholder="/images/x.jpg" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs mb-1">قیمت (اختیاری)</label>
                <input className="w-full border rounded px-2 py-2 ltr:text-left" type="number" value={r.price ?? ""} onChange={(e) => ch(i, { price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs mb-1">قیمت قبلی (اختیاری)</label>
                <input className="w-full border rounded px-2 py-2 ltr:text-left" type="number" value={r.oldPrice ?? ""} onChange={(e) => ch(i, { oldPrice: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="sm:col-span-12 flex gap-2">
                <button onClick={() => mv(i, -1)} className="px-3 py-2 rounded border">بالا</button>
                <button onClick={() => mv(i, 1)} className="px-3 py-2 rounded border">پایین</button>
                <button onClick={() => del(i)} className="px-3 py-2 rounded border text-rose-600">حذف</button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-gray-500">آیتمی ثبت نشده.</div>}
        </div>
      )}
    </main>
  );
}
