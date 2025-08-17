// src/components/BrandStrip.tsx
export default function BrandStrip() {
  const brands = ["nila-nikan", "cerave", "loreal", "nivea", "maybelline"];
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        {brands.map((b) => (
          <div key={b} className="h-12 w-28 bg-gray-100 rounded-xl flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brands/${b}.png`} alt={b} className="max-h-10 object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}
