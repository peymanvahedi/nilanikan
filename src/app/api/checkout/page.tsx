// src/app/checkout/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    line1: "",
    postal: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null);
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const isValid = () =>
    form.fullName.trim().length >= 3 &&
    form.phone.trim().length >= 8 &&
    form.line1.trim().length >= 5;

  const submit = async () => {
    if (!isValid()) {
      setErr("لطفاً نام، موبایل و آدرس را کامل وارد کنید.");
      return;
    }

    try {
      setLoading(true);
      setErr(null);

      const cartId = localStorage.getItem("cartId");
      if (!cartId) {
        setErr("cartId پیدا نشد. سبد خرید را دوباره بسازید.");
        return;
      }

      // 1) ساخت سفارش از روی سبد
      const ch = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId }),
      });
      const chRes = await ch.json();
      if (!ch.ok) throw new Error(chRes?.error || "checkout error");
      const orderId: string = chRes.orderId;

      // 2) ثبت آدرس و تایید COD
      const cf = await fetch("/api/order/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...form }),
      });
      const cfRes = await cf.json();
      if (!cf.ok || !cfRes?.ok) throw new Error(cfRes?.error || "confirm error");

      // 3) نهایی‌سازی (قفل موجودی + بستن سبد)
      const fn = await fetch("/api/order/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, cartId }),
      });
      const fnRes = await fn.json();
      if (!fn.ok || !fnRes?.ok) throw new Error(fnRes?.error || "finalize error");

      // موفق: پاک‌کردن cartId و رفتن به صفحه موفقیت
      localStorage.removeItem("cartId");
      r.push(`/checkout/success?orderId=${orderId}`);
    } catch (e: any) {
      setErr(e?.message || "خطا در ثبت سفارش");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">تسویه حساب (پرداخت درب منزل)</h1>

      {err && (
        <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded p-2">
          {err}
        </div>
      )}

      <div className="grid gap-3">
        <input
          name="fullName"
          placeholder="نام و نام خانوادگی"
          className="border p-2 rounded"
          value={form.fullName}
          onChange={onChange}
        />
        <input
          name="phone"
          placeholder="موبایل"
          className="border p-2 rounded"
          value={form.phone}
          onChange={onChange}
        />
        <input
          name="city"
          placeholder="شهر"
          className="border p-2 rounded"
          value={form.city}
          onChange={onChange}
        />
        <input
          name="line1"
          placeholder="آدرس"
          className="border p-2 rounded"
          value={form.line1}
          onChange={onChange}
        />
        <input
          name="postal"
          placeholder="کد پستی (اختیاری)"
          className="border p-2 rounded"
          value={form.postal}
          onChange={onChange}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-2 px-4 py-2 rounded bg-black text-white disabled:opacity-60"
      >
        {loading ? "در حال ثبت..." : "ثبت سفارش (COD)"}
      </button>
    </div>
  );
}
