"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm, { ProductPayload } from "@/components/admin/ProductForm";

export default function ProductNewPage() {
  const r = useRouter();
  const [form, setForm] = useState<ProductPayload>({
    title: "",
    slug: "",
    description: "",
    price: 0,
    priceBefore: null,
    stock: 0,
    sku: "",
    brandId: null,
    categoryId: null,
    images: [],
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "ذخیره ناموفق");

      alert("محصول ساخته شد ✅");
      // بعد از ساخت محصول، میره به صفحه ویرایش همون محصول
      r.replace(`/admin/products/${j.id}`);
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">محصول جدید</h1>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-green-600 text-white px-4 py-2 disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <button
            onClick={() => r.push("/admin/products")}
            className="rounded bg-gray-400 text-white px-4 py-2"
          >
            بازگشت
          </button>
        </div>
      </div>

      {err && err !== "(مثل قبل، تغییر نکرده)" && (
        <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded p-2">
          {err}
        </div>
      )}

      <ProductForm
        isNew={true}
        form={form}
        setForm={setForm}
        onSave={save}
        saving={saving}
      />
    </div>
  );
}
