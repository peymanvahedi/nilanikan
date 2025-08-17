// GET: منو + آیتم‌ها به صورت درخت
// PUT: ویرایش منو {name,type}
// DELETE: حذف منو و آیتم‌ها
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toTree(items: any[]) {
  const byId: Record<string, any> = {};
  items.forEach((it) => (byId[it.id] = { ...it, children: [] }));
  const roots: any[] = [];
  items.forEach((it) => {
    if (it.parentId && byId[it.parentId]) byId[it.parentId].children.push(byId[it.id]);
    else roots.push(byId[it.id]);
  });
  const sort = (arr: any[]) => { arr.sort((a,b)=>a.order-b.order); arr.forEach(x=>sort(x.children)); };
  sort(roots);
  return roots;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const menu = await prisma.menu.findUnique({ where: { id: params.id } });
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await prisma.menuItem.findMany({ where: { menuId: params.id } });
  return NextResponse.json({ ...menu, tree: toTree(items) });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { name, type } = await req.json();
  const updated = await prisma.menu.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.menu.delete({ where: { id: params.id } }); // onDelete: Cascade در اسکیمای شما آیتم‌ها را پاک می‌کند
  return NextResponse.json({ ok: true });
}
