"use client";

import React, { useEffect, useState } from "react";
import SliderTab, { type Slide } from "./SliderTab";

export default function AdminSliderPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // لود اولیه از localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("homeSliders");
      const arr = raw ? JSON.parse(raw) : [];
      // سازگار با ساختار قدیمی {desktop, mobile}
      const mapped: Slide[] = Array.isArray(arr)
        ? arr.map((x: any) => ({
            id: x.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            desktopUrl: x.desktop || x.desktopUrl || "",
            mobileUrl: x.mobile || x.mobileUrl || "",
            alt: x.alt || "",
          }))
        : [];
      setSlides(mapped);
    } catch {
      setSlides([]);
    }
  }, []);

  const save = async () => {
    setStatus("saving");
    // فقط فیلدهایی که اسلایدر خانه لازم دارد
    const payload = slides.map((s) => ({
      id: s.id,
      desktop: s.desktopUrl,
      mobile: s.mobileUrl || undefined,
      alt: s.alt || undefined,
    }));
    localStorage.setItem("homeSliders", JSON.stringify(payload));
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1200);
  };

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">اسلایدر بنری</h1>
        <button
          onClick={save}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
          disabled={status === "saving"}
        >
          {status === "saving" ? "در حال ذخیره..." : status === "saved" ? "ذخیره شد ✓" : "ذخیره"}
        </button>
      </div>

      <div className="rounded-lg border p-4 bg-gray-50">
        <SliderTab value={slides} onChange={setSlides} />
      </div>

      <p className="text-sm text-gray-500">
        نکته: پس از ذخیره، به صفحه اصلی برو و اسلایدر را ببین. (HomeSlider از
        <code className="mx-1 px-1 rounded bg-gray-200">localStorage["homeSliders"]</code>
        می‌خواند.)
      </p>
    </div>
  );
}
