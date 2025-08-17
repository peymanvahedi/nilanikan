"use client";

import React, { useMemo } from "react";

export type Slide = {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  alt: string;
};

function genId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("خطا در آپلود فایل");
  const data = await res.json();
  if (!data?.url) throw new Error("آدرس فایل برنگشت");
  return data.url as string; // مثل /uploads/xxx.jpg
}

type Props = {
  value: Slide[];
  onChange: (slides: Slide[]) => void;
};

export default function SliderTab({ value, onChange }: Props) {
  const slides = value;

  const addSlide = () =>
    onChange([{ id: genId(), desktopUrl: "", mobileUrl: "", alt: "" }, ...slides]);

  const removeSlide = (id: string) =>
    onChange(slides.filter((s) => s.id !== id));

  const setField = (id: string, field: keyof Slide, val: string) =>
    onChange(slides.map((s) => (s.id === id ? { ...s, [field]: val } : s)));

  const pickAndUpload = async (id: string, field: "desktopUrl" | "mobileUrl") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await uploadFile(file);
        setField(id, field, url);
      } finally {
        input.remove();
      }
    };
    input.click();
  };

  const slidesJson = useMemo(() => JSON.stringify(slides), [slides]); // فقط برای دیباگ

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={addSlide}
          className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
        >
          افزودن اسلاید
        </button>
        <span className="text-xs text-gray-500">({slides.length})</span>
      </div>

      {/* اختیاری: نگاه سریع به داده‌ها */}
      <input type="hidden" name="__slides_debug" value={slidesJson} readOnly />

      {slides.length === 0 && (
        <div className="text-sm text-gray-500">هنوز اسلایدی ندارید.</div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {slides.map((s, i) => (
          <div key={s.id} className="rounded-xl border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">اسلاید {slides.length - i}</div>
              <button
                type="button"
                onClick={() => removeSlide(s.id)}
                className="text-red-600 text-sm"
              >
                حذف
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* دسکتاپ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm">تصویر دسکتاپ</label>
                  <button
                    type="button"
                    onClick={() => pickAndUpload(s.id, "desktopUrl")}
                    className="px-3 py-1.5 rounded-md bg-black text-white text-sm"
                  >
                    آپلود
                  </button>
                </div>
                <input
                  type="text"
                  value={s.desktopUrl}
                  onChange={(e) => setField(s.id, "desktopUrl", e.target.value)}
                  placeholder="/uploads/banner-desktop.jpg"
                  className="w-full border rounded-md px-3 py-2"
                />
                {s.desktopUrl && (
                  <img
                    src={s.desktopUrl}
                    alt={`desktop-${i}`}
                    className="w-full h-40 object-cover rounded-md border"
                  />
                )}
              </div>

              {/* موبایل */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm">تصویر موبایل</label>
                  <button
                    type="button"
                    onClick={() => pickAndUpload(s.id, "mobileUrl")}
                    className="px-3 py-1.5 rounded-md bg-black text-white text-sm"
                  >
                    آپلود
                  </button>
                </div>
                <input
                  type="text"
                  value={s.mobileUrl}
                  onChange={(e) => setField(s.id, "mobileUrl", e.target.value)}
                  placeholder="/uploads/banner-mobile.jpg"
                  className="w-full border rounded-md px-3 py-2"
                />
                {s.mobileUrl && (
                  <img
                    src={s.mobileUrl}
                    alt={`mobile-${i}`}
                    className="w-full h-40 object-cover rounded-md border"
                  />
                )}
              </div>
            </div>

            {/* ALT */}
            <div className="space-y-2">
              <label className="text-sm">متن ALT</label>
              <input
                type="text"
                value={s.alt}
                onChange={(e) => setField(s.id, "alt", e.target.value)}
                placeholder="نمونه بنر ۱"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
