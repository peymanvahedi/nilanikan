// GET: آیتم‌های صاف (flat) همین منو
// POST: افزودن آیتم جدید {title, slug?, icon?, parentId?, order?}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const items = await prisma.menuItem.findMany({
    where: { menuId: params.id },
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { title, slug, icon, parentId, order } = await req.json();
  if (!title) return NextResponse.json({ error: "title لازم است" }, { status: 400 });
  const created = await prisma.menuItem.create({
    data: { title, slug, icon, order: Number(order ?? 0), menuId: params.id, parentId: parentId ?? null },
  });
  return NextResponse.json(created, { status: 201 });
}
