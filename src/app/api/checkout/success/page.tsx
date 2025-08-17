// src/app/checkout/success/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("orderId");
    if (!id) return;
    fetch(`/api/order/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-xl font-bold">سفارش ثبت شد ✅</h1>
      <p>پرداخت در محل انجام می‌شود.</p>
      {order && (
        <div className="rounded border p-3">
          <div>کد سفارش: {order.id}</div>
          <div>مبلغ: {order.total?.toLocaleString?.("fa-IR")} تومان</div>
          <div>وضعیت: {order.status}</div>
        </div>
      )}
    </div>
  );
}
