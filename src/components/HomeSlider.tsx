// src/components/HomeSlider.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";

type Slide = { id: string; desktop: string; mobile?: string };

export default function HomeSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const autoplay = useRef<ReturnType<typeof setInterval> | null>(null);
  const hovering = useRef(false);
  const dragging = useRef(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("homeSliders");
        const arr = raw ? JSON.parse(raw) : [];
        setSlides(Array.isArray(arr) ? arr : []);
        setIdx(0);
      } catch { setSlides([]); }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    if (autoplay.current) clearInterval(autoplay.current);
    autoplay.current = setInterval(() => {
      if (!hovering.current && !dragging.current) setIdx(p => (p + 1) % slides.length);
    }, 5000);
    return () => { if (autoplay.current) clearInterval(autoplay.current); };
  }, [slides.length]);

  if (!slides.length) return null;

  const go = (i:number) => setIdx((i + slides.length) % slides.length);

  // Pointer events (هم برای ماوس هم تاچ)
  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startX.current = e.clientX;
    dragging.current = true;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current === null) return;
    const dx = e.clientX - startX.current;
    const threshold = 60;
    if (dx > threshold) { go(idx - 1); startX.current = e.clientX; }
    else if (dx < -threshold) { go(idx + 1); startX.current = e.clientX; }
  };
  const onPointerUp = () => { dragging.current = false; startX.current = null; };

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 820;

  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl select-none mt-4 md:mt-6 cursor-grab active:cursor-grabbing"
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ perspective: "1200px" }}
    >
      <div className="relative h-auto w-full aspect-[1920/650] max-h-[650px]">
        {slides.map((s, i) => {
          let offset = i - idx;
          if (offset > slides.length / 2) offset -= slides.length;
          if (offset < -slides.length / 2) offset += slides.length;

          const visible = Math.abs(offset) <= 2;
          const translateX = offset * 28;
          const rotateY = -offset * 18;
          const scale = offset === 0 ? 1 : 0.88;
          const z = 100 - Math.abs(offset);
          const src = isMobile && s.mobile ? s.mobile : s.desktop;

          return (
            <img
              key={s.id}
              src={src}
              alt=""
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-[transform,opacity,filter] duration-500 ease-out
                ${visible ? "opacity-100" : "opacity-0"} ${offset === 0 ? "" : "brightness-90"}`}
              style={{ transform: `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`, zIndex: z, willChange: "transform" }}
            />
          );
        })}
      </div>

      <button
        aria-label="قبلی"
        onClick={() => go(idx - 1)}
        className="group absolute left-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-gradient-to-b from-white/90 to-white/60 shadow-xl hover:from-white hover:to-white"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 group-hover:bg-white text-gray-800 text-2xl leading-none">‹</span>
      </button>
      <button
        aria-label="بعدی"
        onClick={() => go(idx + 1)}
        className="group absolute right-4 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-gradient-to-b from-white/90 to-white/60 shadow-xl hover:from-white hover:to-white"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 group-hover:bg-white text-gray-800 text-2xl leading-none">›</span>
      </button>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`اسلاید ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full transition ${i===idx ? "bg-white ring-2 ring-pink-600" : "bg-white/60 hover:bg-white"}`}
          />
        ))}
      </div>
    </section>
  );
}
