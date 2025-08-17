"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard, Autoplay, EffectCoverflow } from "swiper/modules";

type Slide = { id: string; desktop: string; mobile?: string; alt?: string; link?: string };

export default function HomeSliderClient() {
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("homeSliders") || localStorage.getItem("admin.slides");
      const arr = raw ? JSON.parse(raw) : [];
      const clean: Slide[] = Array.isArray(arr)
        ? arr
            .map((x: any) => ({
              id: x.id || `s-${Math.random()}`,
              desktop: x.desktop || x.image || "",
              mobile: x.mobile || "",
              alt: x.alt || "",
              link: x.link || "#",
            }))
            .filter((s) => s.desktop)
        : [];
      setSlides(clean);
    } catch {
      setSlides([]);
    }
  }, []);

  if (!slides.length) return null;

  return (
    <section className="mt-10">
      <div className="relative">
        {/* دکمه‌های ناوبری */}
        <button
          className="hero-prev absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow p-2 md:p-3 hover:bg-white transition-all duration-300"
          aria-label="قبلی"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button
          className="hero-next absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow p-2 md:p-3 hover:bg-white transition-all duration-300"
          aria-label="بعدی"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <Swiper
          modules={[Navigation, Pagination, Keyboard, Autoplay, EffectCoverflow]}
          effect="coverflow"
          coverflowEffect={{
            rotate: 15,
            stretch: 0,
            depth: 180,
            modifier: 1.2,
            slideShadows: true,
          }}
          centeredSlides
          loop
          speed={900}
          keyboard={{ enabled: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ el: ".hero-pagination", clickable: true }}
          navigation={{ nextEl: ".hero-next", prevEl: ".hero-prev" }}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 1 },
            1024: { slidesPerView: 1 },
          }}
          className="hero-swiper"
        >
          {slides.map((s) => (
            <SwiperSlide key={s.id}>
              <a href={s.link || "#"} className="block group">
                <div className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-lg">
                  {/* موبایل */}
                  <img
                    src={s.mobile || s.desktop}
                    alt={s.alt || ""}
                    className="block md:hidden w-full h-[220px] object-cover object-center"
                    loading="lazy"
                  />
                  {/* دسکتاپ */}
                  <img
                    src={s.desktop}
                    alt={s.alt || ""}
                    className="hidden md:block w-full h-[430px] lg:h-[480px] object-cover object-center"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/5 via-black/0 to-black/10" />
                </div>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination */}
        <div className="hero-pagination absolute bottom-3 left-0 right-0 flex justify-center z-10"></div>
      </div>

      <style jsx global>{`
        .hero-swiper .swiper-slide {
          transition: transform 900ms ease, filter 900ms ease;
        }
        .hero-swiper .swiper-slide-active {
          transform: scale(1.02);
          filter: none;
        }
        .hero-swiper .swiper-slide-next,
        .hero-swiper .swiper-slide-prev {
          filter: saturate(0.9) brightness(0.95);
        }
        .hero-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #e5e7eb;
          opacity: 1;
          margin: 0 4px !important;
          transition: all 0.3s ease;
        }
        .hero-pagination .swiper-pagination-bullet-active {
          background: #ec4899;
          width: 18px;
          border-radius: 9999px;
        }
      `}</style>
    </section>
  );
}
