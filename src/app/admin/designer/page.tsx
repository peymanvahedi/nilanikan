// src/app/admin/designer/page.tsx
"use client";

import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

/* ---- Mock data for preview ---- */
const mockProd = {
  id: "abc123",
  title: "ژل کرم آبرسان مدل Acne Solution مناسب پوست چرب",
  brand: "No Acne",
  price: 1650000,
  oldPrice: 3300000,
  image: "https://via.placeholder.com/600x600?text=Main",
  gallery: [
    "https://via.placeholder.com/120x120?text=1",
    "https://via.placeholder.com/120x120?text=2",
    "https://via.placeholder.com/120x120?text=3",
  ],
  categoryIds: ["c1", "c2"],
};
const mockCats = [
  { id: "c1", name: "مراقبت پوست" },
  { id: "c2", name: "آبرسان" },
];

/* ---- helpers ---- */
const nf = new Intl.NumberFormat("fa-IR");
const formatIR = (n: number) => nf.format(n);
const discountPercent = (price: number, old?: number | null) =>
  !old || old <= price ? null : Math.round((1 - price / old) * 100);
const safe = (v: any) => (v ?? "").toString();
const esc = (s: string) =>
  safe(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");

function renderTemplate(tpl: string) {
  const images = Array.from(new Set([mockProd.image, ...(mockProd.gallery || [])])).filter(Boolean);
  const thumbs = images.map(src => `<img src="${src}" class="w-[72px] h-[72px] object-contain border rounded" />`).join("");
  const off = discountPercent(mockProd.price, mockProd.oldPrice);
  const catMap = new Map(mockCats.map(c => [c.id, c.name] as const));
  const catNames = (mockProd.categoryIds || []).map(id => catMap.get(id)).filter(Boolean).join("، ");

  return tpl
    .replaceAll("{{title}}", esc(mockProd.title))
    .replaceAll("{{brand}}", esc(mockProd.brand || ""))
    .replaceAll("{{price}}", formatIR(mockProd.price))
    .replaceAll("{{oldPrice}}", mockProd.oldPrice ? formatIR(mockProd.oldPrice) : "")
    .replaceAll("{{discount}}", off ? String(off) : "")
    .replaceAll("{{slug}}", "demo-abc123")
    .replaceAll("{{categories}}", esc(catNames || ""))
    .replaceAll("{{image}}", images[0] || "")
    .replaceAll("{{thumbnails}}", thumbs)
    .replaceAll("{{breadcrumbs}}", esc(catNames || ""));
}

const debounce = (fn: (...a: any[]) => void, ms = 400) => {
  let t: any;
  return (...a: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export default function AdminDesigner() {
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (editorRef.current) return;

    const editor: any = grapesjs.init({
      container: "#gjs",
      height: "100vh",
      fromElement: false,
      storageManager: { type: "local", autoload: false, autosave: false },
      blockManager: { appendTo: "#blocks" },
      selectorManager: { componentFirst: true },
      canvas: { styles: ["https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"] },
    });

    /* ====== component types (traits) ====== */
    const dc = editor.DomComponents;

    dc.addType("p-var", {
      isComponent: (el: any) => el?.hasAttribute?.("data-var"),
      model: {
        defaults: {
          tagName: "span",
          attributes: { "data-var": "title" },
          content: "{{title}}",
          traits: [
            { type: "select", label: "فیلد", name: "data-var", options: [
              { id: "title", name: "عنوان" }, { id: "brand", name: "برند" },
              { id: "price", name: "قیمت" }, { id: "oldPrice", name: "قیمت قدیم" },
              { id: "discount", name: "تخفیف" }, { id: "categories", name: "دسته‌ها" }, { id: "slug", name: "نامک" }
            ], changeProp: 1 },
            { type: "text", label: "تگ HTML", name: "tagName", changeProp: 1 },
          ],
        },
        init(this: any) {
          this.on("change:attributes:data-var", () => {
            const key = this.getAttributes()["data-var"] || "title";
            this.components(`{{${key}}}`);
          });
        },
      },
    });

    dc.addType("p-price", {
      isComponent: (el: any) => el?.getAttribute?.("data-gjs-type") === "p-price",
      model: {
        defaults: {
          attributes: { "data-gjs-type": "p-price", "data-show-discount": "true", "data-currency": "تومان" },
          classes: ["border","rounded-xl","p-4"],
          traits: [
            { type: "checkbox", name: "data-show-discount", label: "نمایش تخفیف" },
            { type: "text", name: "data-currency", label: "واحد پول" },
          ],
        },
        init(this: any) {
          const rebuild = () => {
            const a = this.getAttributes();
            const show = String(a["data-show-discount"]) !== "false";
            const currency = a["data-currency"] || "تومان";
            const html = `
              ${show ? '<span class="inline-block bg-rose-500 text-white text-xs px-2 py-1 rounded mb-2">٪{{discount}}</span>' : ""}
              <div class="text-sm text-gray-400 line-through">{{oldPrice}}</div>
              <div class="mt-1 text-3xl font-extrabold text-gray-900">{{price}} <span class="text-sm">${currency}</span></div>
            `;
            this.components(html);
          };
          this.on("change:attributes", rebuild);
          rebuild();
        },
      },
    });

    dc.addType("p-gallery", {
      isComponent: (el: any) => el?.getAttribute?.("data-p-gallery") === "1",
      model: {
        defaults: {
          attributes: { "data-p-gallery": "1", "data-max-h": "520", "data-thumb": "72" },
          traits: [
            { type: "number", name: "data-max-h", label: "ارتفاع تصویر اصلی", min: 200, max: 900, step: 10 },
            { type: "number", name: "data-thumb", label: "اندازه بندانگشتی", min: 40, max: 160, step: 2 },
          ],
          classes: ["bg-white","border","rounded-2xl","p-4"],
        },
        init(this: any) {
          const rebuild = () => {
            const a = this.getAttributes();
            const mh = a["data-max-h"] || 520;
            const ts = a["data-thumb"] || 72;
            const html = `
              <div class="grid grid-cols-[1fr_84px] gap-4">
                <div class="border rounded p-3 text-center">
                  <img src="{{image}}" class="max-h-[${mh}px] mx-auto object-contain"/>
                </div>
                <div class="flex flex-col gap-2">
                  ${`{{thumbnails}}`.replaceAll("72", String(ts))}
                </div>
              </div>
            `;
            this.components(html);
          };
          this.on("change:attributes", rebuild);
          rebuild();
        },
      },
    });

    /* ====== blocks ====== */
    editor.BlockManager.add("p-title", { label: "عنوان محصول", category: "محصول",
      content: '<h1 class="text-xl md:text-2xl font-bold" data-gjs-type="p-var" data-var="title">{{title}}</h1>' });
    editor.BlockManager.add("p-brand", { label: "برند", category: "محصول",
      content: '<div class="text-sm text-gray-500" data-gjs-type="p-var" data-var="brand">{{brand}}</div>' });
    editor.BlockManager.add("p-pricebox", { label: "قیمت", category: "محصول",
      content: '<div data-gjs-type="p-price" class="border rounded-xl p-4"></div>' });
    editor.BlockManager.add("p-breadcrumbs", { label: "بردکرامب", category: "محصول",
      content: '<nav class="text-[12px] text-gray-500" data-gjs-type="p-var" data-var="categories">{{categories}}</nav>' });
    editor.BlockManager.add("p-gallery", { label: "گالری", category: "محصول",
      content: '<section data-p-gallery="1" class="bg-white border rounded-2xl p-4"></section>' });
    editor.BlockManager.add("two-col", { label: "۲ ستونه", category: "Layout",
      content: '<div class="grid grid-cols-2 gap-6"><div class="p-4 border rounded">ستون ۱</div><div class="p-4 border rounded">ستون ۲</div></div>' });

    // شروع با اسکلت نمونه
    editor.setComponents(
      '<div class="container mx-auto max-w-[1200px] p-4">' +
        '<div class="text-center mb-4" data-gjs-type="p-var" data-var="categories">{{categories}}</div>' +
        '<h1 class="text-xl md:text-2xl font-bold text-center mb-2" data-gjs-type="p-var" data-var="title">{{title}}</h1>' +
        '<div class="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">' +
          '<section data-p-gallery="1" class="bg-white border rounded-2xl p-4"></section>' +
          '<aside class="bg-white border rounded-2xl p-5">' +
            '<ul class="space-y-3 text-sm text-gray-700 mb-4"><li>ضمانت اصالت و سلامت کالا</li><li>بازگشت کالا تا ۷ روز</li><li>ارسال رایگان سفارش‌های بالای ۲.۵ میلیون</li></ul>' +
            '<div data-gjs-type="p-price" class="border rounded-xl p-4"></div>' +
            '<button class="mt-3 w-full bg-pink-600 hover:bg-pink-700 text-white text-base py-3.5 rounded-xl">افزودن به سبد خرید</button>' +
          "</aside>" +
        "</div>" +
      "</div>"
    );

    /* ====== save + live preview ====== */
    const buildTpl = () => `<style>${editor.getCss()}</style>${editor.getHtml()}`;
    const apply = (tpl: string) => {
      localStorage.setItem("productTemplateV1", tpl);
      const doc = previewRef.current?.contentDocument;
      if (doc) { doc.open(); doc.write(renderTemplate(tpl)); doc.close(); }
    };
    const update = debounce(() => apply(buildTpl()), 400);
    editor.on("update", update);

    const bar = document.getElementById("toolbar");
    if (bar) {
      bar.innerHTML = "";
      const saveBtn = document.createElement("button");
      saveBtn.className = "px-3 py-1.5 rounded bg-pink-600 text-white";
      saveBtn.textContent = "ذخیره قالب";
      saveBtn.onclick = () => apply(buildTpl());
      const loadBtn = document.createElement("button");
      loadBtn.className = "px-3 py-1.5 rounded border";
      loadBtn.textContent = "لود قالب";
      loadBtn.onclick = () => {
        const tpl = localStorage.getItem("productTemplateV1");
        if (tpl) editor.setComponents(tpl);
      };
      bar.append(saveBtn, loadBtn);
    }

    editorRef.current = editor;
    apply(buildTpl());
  }, []);

  return (
    <div className="grid grid-rows-[44px_1fr_280px] h-[calc(100vh-16px)]">
      <div id="toolbar" className="flex items-center gap-2 p-2 border-b bg-white" />
      <div className="grid grid-cols-[240px_1fr] h-full">
        <aside id="blocks" className="border-l p-2 overflow-auto" />
        <main id="gjs" className="h-full" />
      </div>
      <iframe ref={previewRef} className="w-full h-[280px] border-t bg-white" />
    </div>
  );
}
