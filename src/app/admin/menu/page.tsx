"use client";

import { useEffect, useMemo, useState } from "react";

/* ===== Types ===== */
type MenuType = "DESKTOP" | "MOBILE";
type Menu = { id: string; name: string; type: MenuType; updatedAt: string; _count?: { items: number } };
type MenuItem = { id: string; title: string; slug?: string | null; icon?: string | null; order: number; parentId?: string | null };
type Setting = { id?: string; headerLogoUrl?: string | null; mobileLogoUrl?: string | null };

/* ===== Helpers ===== */
async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<T>;
}

/* ===== Page ===== */
export default function AdminMenuPage() {
  const [tab, setTab] = useState<"logo" | "menus">("logo");

  // settings
  const [settings, setSettings] = useState<Setting>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // menus
  const [menus, setMenus] = useState<Menu[]>([]);
  const [type, setType] = useState<MenuType>("MOBILE");
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // form: new menu
  const [newMenuName, setNewMenuName] = useState("");

  // form: new item
  const [itTitle, setItTitle] = useState("");
  const [itSlug, setItSlug] = useState("");
  const [itIcon, setItIcon] = useState("");
  const [itOrder, setItOrder] = useState<number>(0);
  const [itParent, setItParent] = useState<string>("");

  /* load settings */
  useEffect(() => {
    (async () => {
      try {
        const s = await j<Setting>("/api/settings");
        setSettings(s || {});
      } catch {}
    })();
  }, []);

  /* load menus */
  const loadMenus = async () => {
    const list = await j<Menu[]>("/api/menus");
    setMenus(list);
    // انتخاب خودکار
    const first = list.find((m) => m.type === type);
    setSelectedMenuId(first?.id ?? "");
  };
  useEffect(() => { loadMenus().catch(()=>{}); }, []);

  /* load items of selected menu */
  useEffect(() => {
    if (!selectedMenuId) { setItems([]); return; }
    (async () => {
      try {
        setLoadingItems(true);
        const data = await j<MenuItem[]>(`/api/menus/${selectedMenuId}/items`);
        setItems(data);
      } finally { setLoadingItems(false); }
    })();
  }, [selectedMenuId]);

  const menusOfType = useMemo(() => menus.filter(m => m.type === type), [menus, type]);

  /* actions */
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const s = await j<Setting>("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
      setSettings(s);
      alert("لوگوها ذخیره شد");
    } finally { setSavingSettings(false); }
  };

  const createMenu = async () => {
    if (!newMenuName.trim()) return;
    const created = await j<Menu>("/api/menus", { method: "POST", body: JSON.stringify({ name: newMenuName, type }) });
    setNewMenuName("");
    await loadMenus();
    setSelectedMenuId(created.id);
  };

  const addItem = async () => {
    if (!selectedMenuId || !itTitle.trim()) return;
    const body = {
      title: itTitle.trim(),
      slug: itSlug.trim() || null,
      icon: itIcon.trim() || null,
      order: Number(itOrder) || 0,
      parentId: itParent || null,
    };
    await j(`/api/menus/${selectedMenuId}/items`, { method: "POST", body: JSON.stringify(body) });
    setItTitle(""); setItSlug(""); setItIcon(""); setItOrder(0); setItParent("");
    const data = await j<MenuItem[]>(`/api/menus/${selectedMenuId}/items`);
    setItems(data);
  };

  const updateItem = async (id: string, patch: Partial<MenuItem>) => {
    await j(`/api/menu-items/${id}`, { method: "PUT", body: JSON.stringify(patch) });
    const data = await j<MenuItem[]>(`/api/menus/${selectedMenuId}/items`);
    setItems(data);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("حذف آیتم؟")) return;
    await j(`/api/menu-items/${id}`, { method: "DELETE" });
    const data = await j<MenuItem[]>(`/api/menus/${selectedMenuId}/items`);
    setItems(data);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-lg font-bold">مدیریت هدر: لوگو و منو</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("logo")} className={`px-3 py-2 rounded border ${tab==="logo"?"bg-pink-50 border-pink-300":"border-gray-200"}`}>لوگو</button>
        <button onClick={() => setTab("menus")} className={`px-3 py-2 rounded border ${tab==="menus"?"bg-pink-50 border-pink-300":"border-gray-200"}`}>منوها</button>
      </div>

      {tab === "logo" ? (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="text-sm mb-1">لوگوی دسکتاپ (URL)</div>
              <input className="w-full border rounded px-3 py-2" value={settings.headerLogoUrl ?? ""} onChange={e=>setSettings(s=>({...s, headerLogoUrl: e.target.value}))}/>
            </label>
            <label className="block">
              <div className="text-sm mb-1">لوگوی موبایل (URL)</div>
              <input className="w-full border rounded px-3 py-2" value={settings.mobileLogoUrl ?? ""} onChange={e=>setSettings(s=>({...s, mobileLogoUrl: e.target.value}))}/>
            </label>
          </div>
          <button onClick={saveSettings} disabled={savingSettings} className="px-4 py-2 rounded bg-pink-600 text-white disabled:opacity-60">
            {savingSettings ? "در حال ذخیره…" : "ذخیره"}
          </button>
        </section>
      ) : (
        <section className="space-y-6">
          {/* Select type and menu */}
          <div className="flex flex-wrap gap-3 items-end">
            <label className="block">
              <div className="text-sm mb-1">نوع منو</div>
              <select className="border rounded px-3 py-2" value={type} onChange={(e)=>{ setType(e.target.value as MenuType); const first = menus.find(m=>m.type===e.target.value); setSelectedMenuId(first?.id ?? ""); }}>
                <option value="MOBILE">موبایل</option>
                <option value="DESKTOP">دسکتاپ</option>
              </select>
            </label>

            <label className="block">
              <div className="text-sm mb-1">انتخاب منو</div>
              <select className="border rounded px-3 py-2 min-w-60" value={selectedMenuId} onChange={(e)=>setSelectedMenuId(e.target.value)}>
                <option value="">— انتخاب کنید —</option>
                {menusOfType.map(m=>(
                  <option key={m.id} value={m.id}>{m.name} {m._count ? `(${m._count.items})` : ""}</option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <input placeholder="نام منوی جدید" className="border rounded px-3 py-2" value={newMenuName} onChange={e=>setNewMenuName(e.target.value)} />
              <button className="px-3 py-2 rounded bg-gray-900 text-white" onClick={createMenu}>+ ساخت منو</button>
            </div>
          </div>

          {/* Items */}
          {selectedMenuId ? (
            <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
              {/* add item */}
              <div className="border rounded p-4 space-y-3">
                <div className="font-semibold mb-2">افزودن آیتم</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-sm mb-1">عنوان</div>
                    <input className="w-full border rounded px-3 py-2" value={itTitle} onChange={e=>setItTitle(e.target.value)} />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">اسلاگ/لینک</div>
                    <input className="w-full border rounded px-3 py-2" value={itSlug} onChange={e=>setItSlug(e.target.value)} placeholder="/categories/slug یا slug" />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">آیکن (ایموجی/نام)</div>
                    <input className="w-full border rounded px-3 py-2" value={itIcon} onChange={e=>setItIcon(e.target.value)} placeholder="💄 یا perfume" />
                  </label>
                  <label className="block">
                    <div className="text-sm mb-1">ترتیب</div>
                    <input type="number" className="w-full border rounded px-3 py-2" value={itOrder} onChange={e=>setItOrder(Number(e.target.value||0))} />
                  </label>
                  <label className="block sm:col-span-2">
                    <div className="text-sm mb-1">زیرمنویِ</div>
                    <select className="w-full border rounded px-3 py-2" value={itParent} onChange={e=>setItParent(e.target.value)}>
                      <option value="">— ریشه —</option>
                      {items.map(it=>(
                        <option key={it.id} value={it.id}>{it.title}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <button onClick={addItem} className="px-4 py-2 rounded bg-pink-600 text-white">افزودن آیتم</button>
              </div>

              {/* list items */}
              <div className="border rounded p-4">
                <div className="font-semibold mb-3">آیتم‌ها</div>
                {loadingItems ? (
                  <div className="text-sm text-gray-500">در حال بارگذاری…</div>
                ) : items.length === 0 ? (
                  <div className="text-sm text-gray-500">آیتمی ندارید.</div>
                ) : (
                  <ul className="space-y-3">
                    {items.map((it) => (
                      <li key={it.id} className="border rounded p-3">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div className="font-medium">{it.title}</div>
                          <div className="text-xs text-gray-500">order: {it.order} {it.parentId ? "• زیرمنو" : ""}</div>
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-4">
                          <input className="border rounded px-2 py-1" defaultValue={it.title} onBlur={(e)=>updateItem(it.id,{title:e.target.value})}/>
                          <input className="border rounded px-2 py-1" defaultValue={it.slug ?? ""} placeholder="slug یا /link" onBlur={(e)=>updateItem(it.id,{slug:e.target.value})}/>
                          <input className="border rounded px-2 py-1" defaultValue={it.icon ?? ""} placeholder="💄" onBlur={(e)=>updateItem(it.id,{icon:e.target.value})}/>
                          <input type="number" className="border rounded px-2 py-1" defaultValue={it.order} onBlur={(e)=>updateItem(it.id,{order:Number(e.target.value||0)})}/>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <select className="border rounded px-2 py-1" value={it.parentId ?? ""} onChange={(e)=>updateItem(it.id,{parentId:e.target.value || null})}>
                            <option value="">— ریشه —</option>
                            {items.filter(p=>p.id!==it.id).map(p=>(
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                          <button onClick={()=>deleteItem(it.id)} className="px-3 py-1 rounded bg-red-600 text-white">حذف</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">یک منو انتخاب یا بسازید.</div>
          )}
        </section>
      )}
    </div>
  );
}
