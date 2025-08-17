"use client";

import { useEffect, useState } from "react";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };

export type ProductPayload = {
  title: string;
  slug?: string;
  description?: string;
  price: number;
  priceBefore?: number | null;
  stock: number;
  sku?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  images: string[];
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const j = await res.json();
  if (!res.ok || !j?.url) throw new Error(j?.error || "خطا در آپلود");
  return j.url as string;
}

export default function ProductForm({
  isNew,
  form,
  setForm,
  onSave,
  saving,
}: {
  isNew: boolean;
  form: ProductPayload;
  setForm: (f: ProductPayload) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // بارگذاری برند و دسته
  useEffect(() => {
    (async () => {
      try {
        const [b, c] = await Promise.all([
          fetch("/api/brands").then((r) => r.json()).catch(() => []),
          fetch("/api/categories").then((r) => r.json()).catch(() => []),
        ]);
        setBrands(Array.isArray(b) ? b : b.items ?? []);
        setCategories(Array.isArray(c) ? c : c.items ?? []);
      } catch {}
    })();
  }, []);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]:
        name === "price" || name === "priceBefore" || name === "stock"
          ? Number(value || 0)
          : value,
    });
  };

  const addImageFromFile = async (f: File) => {
    try {
      const url = await uploadFile(f);
      setForm({ ...form, images: [...form.images, url] });
    } catch (e: any) {
      alert(e?.message || "آپلود ناموفق");
    }
  };

  const removeImage = (url: string) =>
    setForm({ ...form, images: form.images.filter((x) => x !== url) });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ستون ۱ */}
      <div className="space-y-3">
        <input
          name="title"
          placeholder="عنوان"
          className="border rounded p-2 w-full"
          value={form.title}
          onChange={onChange}
        />
        <input
          name="slug"
          placeholder="اسلاگ (اختیاری)"
          className="border rounded p-2 w-full"
          value={form.slug || ""}
          onChange={onChange}
        />
        <textarea
          name="description"
          placeholder="توضیحات"
          className="border rounded p-2 w-full min-h-[120px]"
          value={form.description || ""}
          onChange={onChange}
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">قیمت</label>
            <input
              name="price"
              type="number"
              className="border rounded p-2 w-full"
              value={form.price}
              onChange={onChange}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">قیمت قبل</label>
            <input
              name="priceBefore"
              type="number"
              className="border rounded p-2 w-full"
              value={form.priceBefore ?? ""}
              onChange={onChange}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">موجودی</label>
            <input
              name="stock"
              type="number"
              className="border rounded p-2 w-full"
              value={form.stock}
              onChange={onChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">SKU</label>
            <input
              name="sku"
              className="border rounded p-2 w-full"
              value={form.sku || ""}
              onChange={onChange}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">برند</label>
            <select
              name="brandId"
              className="border rounded p-2 w-full"
              value={form.brandId ?? ""}
              onChange={(e) =>
                setForm({ ...form, brandId: e.target.value || null })
              }
            >
              <option value="">بدون برند</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">دسته‌بندی</label>
          <select
            name="categoryId"
            className="border rounded p-2 w-full"
            value={form.categoryId ?? ""}
            onChange={(e) =>
              setForm({ ...form, categoryId: e.target.value || null })
            }
          >
            <option value="">بدون دسته</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ستون ۲ - تصاویر */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">تصاویر</div>
          <label className="cursor-pointer rounded bg-gray-800 text-white px-3 py-2 text-sm">
            آپلود تصویر
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addImageFromFile(f);
              }}
            />
          </label>
        </div>
        {form.images?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {form.images.map((url, idx) => (
              <div
                key={`${idx}-${typeof url === "string" ? url : "img"}`}
                className="relative border rounded overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 left-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500">تصویری اضافه نشده است.</div>
        )}
        <div>
          <label className="text-xs text-gray-500">افزودن با URL</label>
          <div className="flex gap-2">
            <input
              id="imgUrl"
              placeholder="/uploads/xxx.jpg یا https://..."
              className="border rounded p-2 flex-1"
            />
            <button
              type="button"
              className="rounded bg-blue-600 text-white px-3"
              onClick={() => {
                const el = document.getElementById(
                  "imgUrl"
                ) as HTMLInputElement;
                const url = el?.value?.trim();
                if (url) {
                  setForm({ ...form, images: [...form.images, url] });
                  el.value = "";
                }
              }}
            >
              افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
