import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IconKey } from "@prisma/client";

// PUT: {title?, slug?, icon?, parentId?, order?}
export async function PUT(req: Request, { params }: { params: { itemId: string } }) {
  const body = await req.json();

  if (body.icon && !Object.values(IconKey).includes(body.icon)) {
    return NextResponse.json({ error: "icon نامعتبر است" }, { status: 400 });
  }

  const updated = await prisma.menuItem.update({
    where: { id: params.itemId },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
      ...(body.icon !== undefined ? { icon: (body.icon as IconKey) ?? null } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
      ...(body.parentId !== undefined ? { parentId: body.parentId || null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { itemId: string } }) {
  await prisma.menuItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true });
}
