// src/app/admin/products/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm, { ProductPayload } from "@/components/admin/ProductForm";

export default function ProductEditPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id || "");
  const isNew = id === "new";
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
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // بارگذاری محصول؛ ابتدا با id سپس fallback با slug
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const byId = await fetch(`/api/products/${encodeURIComponent(id)}`);
        if (byId.ok) {
          const p = await byId.json();
          if (p?.id) {
            setForm({
              title: p.title ?? "",
              slug: p.slug ?? "",
              description: p.description ?? "",
              price: p.price ?? 0,
              priceBefore: p.priceBefore ?? null,
              stock: p.stock ?? 0,
              sku: p.sku ?? "",
              brandId: p.brandId ?? null,
              categoryId: p.categoryId ?? null,
              images: Array.isArray(p.images) ? p.images : [],
            });
            setLoading(false);
            return;
          }
        }

        // fallback با جستجوی slug
        const sp = new URLSearchParams({ slug: id, page: "1", pageSize: "1" });
        const bySlug = await fetch(`/api/products?${sp.toString()}`);
        const j = await bySlug.json().catch(() => ({}));
        const p = j?.items?.[0];
        if (bySlug.ok && p?.id) {
          setForm({
            title: p.title ?? "",
            slug: p.slug ?? "",
            description: p.description ?? "",
            price: p.price ?? 0,
            priceBefore: p.priceBefore ?? null,
            stock: p.stock ?? 0,
            sku: p.sku ?? "",
            brandId: p.brandId ?? null,
            categoryId: p.categoryId ?? null,
            images: Array.isArray(p.images) ? p.images : [],
          });
        } else {
          setErr(j?.error || "محصول یافت نشد");
        }
      } catch {
        setErr("خطا در بارگذاری محصول");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "ذخیره ناموفق");

      alert("تغییرات ذخیره شد ✅");
      r.push("/admin/products");
    } catch (e: any) {
      setErr(e?.message || "خطا");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4">در حال بارگذاری…</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">ویرایش محصول</h1>
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

      {err && (
        <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded p-2">
          {err}
        </div>
      )}

      <ProductForm
        isNew={false}
        form={form}
        setForm={setForm}
        onSave={save}
        saving={saving}
      />
    </div>
  );
}
