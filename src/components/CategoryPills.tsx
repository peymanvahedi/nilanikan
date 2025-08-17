// src/components/CategoryPills.tsx
export default function CategoryPills() {
  const items = [
    { title: "مراقبت پوست", href: "/category/skin", icon: "🧴" },
    { title: "مراقبت مو", href: "/category/hair", icon: "💇‍♀️" },
    { title: "آرایش صورت", href: "/category/makeup", icon: "💄" },
    { title: "بهداشت شخصی", href: "/category/hygiene", icon: "🧼" },
    { title: "عطر و ادکلن", href: "/category/perfume", icon: "🌸" },
  ];
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
      {items.map((it) => (
        <a
          key={it.href}
          href={it.href}
          className="shrink-0 border rounded-full px-4 py-2 bg-white hover:bg-gray-50"
          title={it.title}
        >
          <span className="ml-2">{it.icon}</span>{it.title}
        </a>
      ))}
    </div>
  );
}
