"use client";

import { useEffect, useState } from "react";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };

export type AmazingSourceMode = "auto" | "manual";
export type AmazingConfigState = {
  mode: AmazingSourceMode;     // auto | manual
  categoryId?: string;         // فیلتر اختیاری
  brandId?: string;            // فیلتر اختیاری
  limit: number;               // تعداد آیتم
  minDiscount: number;         // حداقل درصد تخفیف
  sort: "discountDesc" | "newest" | "priceAsc" | "priceDesc"; // مرتب‌سازی
};

const CFG_KEY = "amazing.config.v1";

const readCfg = (): AmazingConfigState => {
  if (typeof window === "undefined") {
    return { mode: "manual", limit: 10, minDiscount: 0, sort: "discountDesc" };
  }
  try {
    const raw = localStorage.getItem(CFG_KEY);
    return raw
      ? { ...{ mode: "manual", limit: 10, minDiscount: 0, sort: "discountDesc" }, ...(JSON.parse(raw) as any) }
      : { mode: "manual", limit: 10, minDiscount: 0, sort: "discountDesc" };
  } catch {
    return { mode: "manual", limit: 10, minDiscount: 0, sort: "discountDesc" };
  }
};

const writeCfg = (cfg: AmazingConfigState) => {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch {}
};

export default function AmazingConfig() {
  const [cfg, setCfg] = useState<AmazingConfigState>(readCfg());
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // بارگذاری انتخاب‌ها از API
    (async () => {
      try {
        const [b, c] = await Promise.all([
          fetch("/api/brands").then((r) => r.json()).catch(() => []),
          fetch("/api/categories").then((r) => r.json()).catch(() => []),
        ]);
        setBrands(Array.isArray(b) ? b : b.items ?? []);
        setCats(Array.isArray(c) ? c : c.items ?? []);
      } catch {}
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    writeCfg(cfg);
    await new Promise((r) => setTimeout(r, 350));
    setSaving(false);
    setMsg("تنظیمات ذخیره شد ✔");
    setTimeout(() => setMsg(null), 1200);
  };

  return (
    <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">تنظیمات منبع «شگفت‌انگیزها»</div>
        {msg && <div className="text-xs text-emerald-700">{msg}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">حالت</label>
          <select
            value={cfg.mode}
            onChange={(e) => setCfg((s) => ({ ...s, mode: e.target.value as AmazingSourceMode }))}
            className="border rounded p-2 w-full"
          >
            <option value="manual">دستی (لیست داخلی)</option>
            <option value="auto">خودکار از کاتالوگ</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">دسته (اختیاری)</label>
          <select
            value={cfg.categoryId ?? ""}
            onChange={(e) => setCfg((s) => ({ ...s, categoryId: e.target.value || undefined }))}
            className="border rounded p-2 w-full"
            disabled={cfg.mode !== "auto"}
          >
            <option value="">همه دسته‌ها</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">برند (اختیاری)</label>
          <select
            value={cfg.brandId ?? ""}
            onChange={(e) => setCfg((s) => ({ ...s, brandId: e.target.value || undefined }))}
            className="border rounded p-2 w-full"
            disabled={cfg.mode !== "auto"}
          >
            <option value="">همه برندها</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">حداقل ٪تخفیف</label>
          <input
            type="number"
            min={0}
            max={90}
            className="border rounded p-2 w-full"
            value={cfg.minDiscount}
            onChange={(e) => setCfg((s) => ({ ...s, minDiscount: Math.max(0, Number(e.target.value || 0)) }))}
            disabled={cfg.mode !== "auto"}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">تعداد نمایش</label>
          <input
            type="number"
            min={1}
            max={30}
            className="border rounded p-2 w-full"
            value={cfg.limit}
            onChange={(e) => setCfg((s) => ({ ...s, limit: Math.min(30, Math.max(1, Number(e.target.value || 1))) }))}
            disabled={cfg.mode !== "auto"}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">مرتب‌سازی</label>
          <select
            className="border rounded p-2 w-full"
            value={cfg.sort}
            onChange={(e) => setCfg((s) => ({ ...s, sort: e.target.value as AmazingConfigState["sort"] }))}
            disabled={cfg.mode !== "auto"}
          >
            <option value="discountDesc">بیشترین تخفیف</option>
            <option value="newest">جدیدترین</option>
            <option value="priceAsc">ارزان‌ترین</option>
            <option value="priceDesc">گران‌ترین</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded bg-amber-600 text-white disabled:opacity-60"
        >
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات شگفت‌انگیز"}
        </button>
      </div>
    </div>
  );
}
