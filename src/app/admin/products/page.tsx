"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Brand = { id: string; name: string };
type Category = { id: string; name: string };
type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  stock: number;
  sku?: string | null;
  brand?: Brand | null;
  category?: Category | null;
  createdAt?: string;
};

type ListResp = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

const pageSizes = [10, 20, 50];

export default function AdminProductsPage() {
  const [q, setQ] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<ListResp | null>(null);
  const [loading, setLoading] = useState(false);

  // بارگیری برند/دسته‌بندی
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

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (brandId) sp.set("brandId", brandId);
    if (categoryId) sp.set("categoryId", categoryId);
    if (sort) sp.set("sort", sort);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp.toString();
  }, [q, brandId, categoryId, sort, page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?${qs}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (r.ok) {
        const newCount = (data?.items?.length ?? 1) - 1;
        if (newCount <= 0 && page > 1) setPage((p) => p - 1);
        else load();
      } else {
        const j = await r.json().catch(() => ({}));
        if (j?.error && j.error !== "(مثل قبل، تغییر نکرده)") {
          alert(j.error);
        } else {
          alert("حذف ناموفق");
        }
      }
    } catch {
      alert("خطا در حذف محصول");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">کاتالوگ محصولات</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-pink-600 text-white px-3 py-2 text-sm"
        >
          + محصول جدید
        </Link>
      </div>

      {/* فیلترها */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          placeholder="جستجو (عنوان/کد/توضیحات)"
          className="border rounded p-2"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select
          className="border rounded p-2"
          value={brandId}
          onChange={(e) => {
            setPage(1);
            setBrandId(e.target.value);
          }}
        >
          <option value="">همه برندها</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={categoryId}
          onChange={(e) => {
            setPage(1);
            setCategoryId(e.target.value);
          }}
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">جدیدترین</option>
          <option value="priceAsc">ارزان‌ترین</option>
          <option value="priceDesc">گران‌ترین</option>
          <option value="stockAsc">کمترین موجودی</option>
          <option value="stockDesc">بیشترین موجودی</option>
        </select>
        <select
          className="border rounded p-2"
          value={pageSize}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}
        >
          {pageSizes.map((s) => (
            <option key={s} value={s}>
              {s} در صفحه
            </option>
          ))}
        </select>
      </div>

      {/* جدول */}
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
            {loading && (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  در حال بارگذاری...
                </td>
              </tr>
            )}
            {!loading && data?.items?.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center">
                  موردی یافت نشد
                </td>
              </tr>
            )}
            {!loading &&
              data?.items?.map((p) => (
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
                  <td className="p-2 space-x-2 space-x-reverse">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="px-2 py-1 rounded bg-blue-600 text-white"
                    >
                      ویرایش
                    </Link>
                    <button
                      onClick={() => remove(p.id)}
                      className="px-2 py-1 rounded bg-red-600 text-white"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* صفحه‌بندی */}
      {data && data.pages > 1 && (
        <div className="flex items-center gap-2">
          <button
            className="border rounded px-3 py-1"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </button>
          <div className="text-sm">
            صفحه {data.page} از {data.pages}
          </div>
          <button
            className="border rounded px-3 py-1"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
          >
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
