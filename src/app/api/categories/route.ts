import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// همه دسته‌ها
export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "desc" },  // این فیلد توی مدل هست
  });
  return NextResponse.json(categories);
}


// ساخت دسته جدید
export async function POST(req: Request) {
  try {
    const { name, slug, parentId } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: "نام و اسلاگ لازم است" }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: { name, slug, parentId: parentId || null },
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "خطا" }, { status: 500 });
  }
}

// ویرایش دسته
export async function PUT(req: Request) {
  try {
    const { id, name, slug, parentId } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "شناسه لازم است" }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug, parentId: parentId || null },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "خطا" }, { status: 500 });
  }
}

// حذف دسته
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "شناسه لازم است" }, { status: 400 });
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "خطا" }, { status: 500 });
  }
}
