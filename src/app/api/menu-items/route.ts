import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IconKey } from "@prisma/client";

// GET: ?menuId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const menuId = searchParams.get("menuId") || undefined;

  const items = await prisma.menuItem.findMany({
    where: menuId ? { menuId } : undefined,
    include: { children: true },
    orderBy: [{ order: "asc" }, { id: "asc" }], // بدون createdAt
  });

  return NextResponse.json(items);
}

// POST: {menuId, title, slug?, icon?, parentId?, order?}
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const menuId = body?.menuId as string | undefined;
  const title = (body?.title || "").trim();
  const slug = (body?.slug ?? null) as string | null;
  const parentId = (body?.parentId ?? null) as string | null;
  const order = body?.order !== undefined ? Number(body.order) : 0;
  const icon = body?.icon as IconKey | undefined;

  if (!menuId || !title) {
    return NextResponse.json({ error: "menuId و title لازم است" }, { status: 400 });
  }
  if (icon && !Object.values(IconKey).includes(icon)) {
    return NextResponse.json({ error: "icon نامعتبر است" }, { status: 400 });
  }

  const created = await prisma.menuItem.create({
    data: { menuId, title, slug, parentId, order, icon: icon ?? null },
  });

  return NextResponse.json(created, { status: 201 });
}
