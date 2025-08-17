// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toInt(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function slugify(s: string) {
  return s
    .toString()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FF\w-]+/g, "") // حروف فارسی و لاتین/عدد
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

// GET /api/products?q=&brandId=&categoryId=&page=1&pageSize=20&sort=newest|priceAsc|priceDesc|stockAsc|stockDesc
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const brandId = url.searchParams.get("brandId");
  const categoryId = url.searchParams.get("categoryId");
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const pageSize = Math.min(100, Math.max(1, toInt(url.searchParams.get("pageSize"), 20)));
  const sort = url.searchParams.get("sort") || "newest";

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (brandId) where.brandId = brandId;
  if (categoryId) where.categoryId = categoryId;

  let orderBy: any = { createdAt: "desc" };
  if (sort === "priceAsc") orderBy = { price: "asc" };
  else if (sort === "priceDesc") orderBy = { price: "desc" };
  else if (sort === "stockAsc") orderBy = { stock: "asc" };
  else if (sort === "stockDesc") orderBy = { stock: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { brand: true, category: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    pages: Math.ceil(total / pageSize),
  });
}

// POST /api/products  (ساخت محصول)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description = "",
      price,
      priceBefore = null,
      stock = 0,
      sku = null,
      brandId = null,
      categoryId = null,
      images = [],
      slug,
    } = body || {};

    if (!title || typeof price !== "number") {
      return NextResponse.json({ error: "عنوان و قیمت الزامی است" }, { status: 400 });
    }

    const finalSlug = slug?.trim() || slugify(title);
    const data = {
      title: String(title),
      slug: finalSlug,
      description: String(description || ""),
      price: Math.max(0, Number(price)),
      priceBefore: priceBefore == null ? null : Math.max(0, Number(priceBefore)),
      stock: Math.max(0, Number(stock || 0)),
      sku: sku ? String(sku) : null,
      brandId: brandId || null,
      categoryId: categoryId || null,
      images: Array.isArray(images) ? images : [],
    };

    // اطمینان از یکتا بودن اسلاگ
    const exists = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (exists) {
      return NextResponse.json({ error: "اسلاگ تکراری است" }, { status: 409 });
    }

    const product = await prisma.product.create({ data });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطا در ساخت محصول" }, { status: 500 });
  }
}
