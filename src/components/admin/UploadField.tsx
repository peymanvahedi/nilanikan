"use client";
import React, { useRef, useState } from "react";

type Props = {
  label: string;
  name: string;            // نام فیلدی که با فرم ارسال می‌شود
  defaultValue?: string;   // مقدار اولیه (اختیاری)
};

export default function UploadField({ label, name, defaultValue = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("خطا در آپلود");
      const data = await res.json();
      if (!data?.url) throw new Error("آدرس فایل برگشت داده نشد");
      setValue(data.url);           // مثلا: /uploads/1710000_abc.jpg
      e.target.value = "";
    } catch (er: any) {
      setErr(er?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm">{label}</label>
        <button
          type="button"
          onClick={openPicker}
          className="px-3 py-1.5 rounded-md bg-black text-white text-sm"
        >
          آپلود
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/uploads/your-image.jpg"
          className="flex-1 border rounded-md px-3 py-2"
        />
      </div>

      {/* برای ارسال فرم */}
      <input type="hidden" name={name} value={value} readOnly />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {loading && <div className="text-xs">در حال آپلود…</div>}
      {err && <div className="text-xs text-red-600">{err}</div>}

      {value && (
        <img src={value} alt={label} className="w-full h-36 object-cover rounded-md border" />
      )}
    </div>
  );
}
