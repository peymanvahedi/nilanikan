// src/components/Header.tsx
"use client";

import dynamic from "next/dynamic";

// برای سبک‌تر شدن باندل، کامپوننت‌ها را داینامیک لود می‌کنیم
const HeaderMobile = dynamic(() => import("./HeaderMobile"), { ssr: false });
const HeaderDesktop = dynamic(() => import("./HeaderDesktop"), { ssr: false });

export default function Header() {
  return (
    <>
      {/* موبایل و تبلت کوچک */}
      <div className="md:hidden">
        <HeaderMobile />
      </div>

      {/* دسکتاپ */}
      <div className="hidden md:block">
        <HeaderDesktop />
      </div>
    </>
  );
}
