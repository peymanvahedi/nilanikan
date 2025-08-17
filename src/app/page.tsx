// src/app/page.tsx
"use client";

import dynamic from "next/dynamic";

const HomeSliderClient = dynamic(() => import("@/components/HomeSlider.client"), { ssr: false });
const AmazingSlider    = dynamic(() => import("@/components/AmazingSlider.client"), { ssr: false });
const CountdownTimer   = dynamic(() => import("@/components/CountdownTimer"), { ssr: false });

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-7xl px-0 md:px-4 py-0">
      {/* اسلایدر هرو */}
      <section className="mt-6">
        <HomeSliderClient />
      </section>

      {/* شگفت‌انگیز + تایمر */}
      <section className="mt-10 bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🔥 محصولات شگفت‌انگیز</h2>
          {/* تایمر با «پیل»‌های صورتی و اعداد فارسی */}
          <CountdownTimer targetDate="2025-08-20T23:59:59" showUnits />
        </div>

        {/* هدر داخلی اسلایدر مخفی */}
        <AmazingSlider showHeader={false} />
      </section>
    </main>
  );
}
