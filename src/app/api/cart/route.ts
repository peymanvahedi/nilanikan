import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(cart || { items: [] });
}

function slugify(s: string) {
  return (s || "")
    .toString()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FF\w-]/g, "")
    .toLowerCase()
    .slice(0, 60);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, productId, qty = 1, price, title, image, slug } = body || {};

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!productId && (!title || typeof price !== "number")) {
    return NextResponse.json({ error: "Either productId or (title + price) is required" }, { status: 400 });
  }

  let cart = await prisma.cart.findFirst({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  let realProductId = productId || null;
  if (realProductId) {
    const ok = await prisma.product.findUnique({ where: { id: realProductId } });
    if (!ok) realProductId = null;
  }
  if (!realProductId) {
    const p = await prisma.product.create({
      data: {
        title: title || "Product",
        slug: slug ? slugify(slug) : slugify(title || `p-${Date.now()}`),
        description: "",
        price: typeof price === "number" ? price : 0,
        stock: 0,
        images: image ? [image] : [],
      },
      select: { id: true },
    });
    realProductId = p.id;
  }

  await prisma.cartItem.create({
    data: { cartId: cart.id, productId: realProductId!, qty, price: typeof price === "number" ? price : 0 },
  });

  const updated = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(updated);
}

export async function PATCH(req: Request) {
  const { itemId, qty } = await req.json();
  if (!itemId || typeof qty !== "number") {
    return NextResponse.json({ error: "itemId and qty are required" }, { status: 400 });
  }

  const item = await prisma.cartItem.update({
    where: { id: itemId },
    data: { qty },
    include: { cart: { include: { items: { include: { product: true } } } } },
  });
  return NextResponse.json(item.cart);
}

export async function DELETE(req: Request) {
  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });

  const deleted = await prisma.cartItem.delete({ where: { id: itemId }, include: { cart: true } });

  const cart = await prisma.cart.findUnique({
    where: { id: deleted.cartId },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json(cart);
}
