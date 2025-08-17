// src/app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { brand: true, category: true },
  });
  if (!product) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data: any = {};
    if ("title" in body) data.title = String(body.title);
    if ("description" in body) data.description = String(body.description || "");
    if ("price" in body) data.price = Math.max(0, Number(body.price));
    if ("priceBefore" in body)
      data.priceBefore = body.priceBefore == null ? null : Math.max(0, Number(body.priceBefore));
    if ("stock" in body) data.stock = Math.max(0, Number(body.stock));
    if ("sku" in body) data.sku = body.sku ? String(body.sku) : null;
    if ("brandId" in body) data.brandId = body.brandId || null;
    if ("categoryId" in body) data.categoryId = body.categoryId || null;
    if ("images" in body) data.images = Array.isArray(body.images) ? body.images : [];
    if ("slug" in body && body.slug) data.slug = String(body.slug);

    // اگر slug تغییر کرد، یکتا بودن را بررسی کن
    if (data.slug) {
      const other = await prisma.product.findUnique({ where: { slug: data.slug } });
      if (other && other.id !== params.id) {
        return NextResponse.json({ error: "اسلاگ تکراری است" }, { status: 409 });
      }
    }

    const updated = await prisma.product.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطا در به‌روزرسانی" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "حذف ناموفق" }, { status: 500 });
  }
}
