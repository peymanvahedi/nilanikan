// src/components/Hero.tsx
"use client";

export default function Hero() {
  return (
    <section className="rounded-2xl overflow-hidden relative bg-gradient-to-l from-rose-100 to-emerald-50">
      <div className="grid md:grid-cols-2">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-[1.3]">
            زیبایی طبیعی با محصولات <span className="text-emerald-700">نیلا نیکان</span>
          </h1>
          <p className="text-gray-600 mt-3">
            تخفیف‌های شگفت‌انگیز مراقبت پوست و مو؛ ارسال سریع و ضمانت اصالت کالا.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="#deals" className="rounded-xl px-5 py-2 bg-emerald-600 text-white">مشاهده تخفیف‌ها</a>
            <a href="/category/kosmetik" className="rounded-xl px-5 py-2 border">آرایشی و بهداشتی</a>
          </div>
        </div>
        <div className="h-64 md:h-full bg-[url('/banner-hero.jpg')] bg-cover bg-center" />
      </div>
    </section>
  );
}
