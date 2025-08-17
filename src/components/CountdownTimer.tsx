"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  targetDate: string;
  showUnits?: boolean;
};

export default function CountdownTimer({ targetDate, showUnits }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = +new Date(targetDate) - +new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const format = (num: number) => num.toString().padStart(2, "0");

  const items = [
    { value: format(timeLeft.days), label: "روز" },
    { value: format(timeLeft.hours), label: "ساعت" },
    { value: format(timeLeft.minutes), label: "دقیقه" },
    { value: format(timeLeft.seconds), label: "ثانیه" },
  ];

  return (
    <div className="flex gap-1 md:gap-2 items-center">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="px-2 py-1 md:px-3 md:py-1.5 rounded-lg bg-pink-600 text-white text-xs md:text-sm font-bold shadow">
            {item.value}
          </span>
          {showUnits && <span className="text-[10px] md:text-xs mt-0.5 text-pink-700">{item.label}</span>}
        </div>
      ))}
    </div>
  );
}
