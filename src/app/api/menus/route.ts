// src/app/api/menus/route.ts
// GET: لیست منوها (اختیاری: ?type=MOBILE|DESKTOP) + شمارش آیتم‌ها
// POST: ساخت/برگرداندن منوی جدید { name, type: 'DESKTOP' | 'MOBILE' } (idempotent)
// نکته: روی مدل Menu یک @@unique([name, type]) داریم.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "MOBILE" | "DESKTOP" | null;

    const menus = await prisma.menu.findMany({
      where: type ? { type } : undefined,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(menus);
  } catch (e) {
    console.error("GET /api/menus error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "").trim();
    const type = body?.type as "MOBILE" | "DESKTOP" | undefined;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name و type لازم است" },
        { status: 400 }
      );
    }

    // تلاش برای ایجاد؛ اگر تکراری بود، همان رکورد موجود را برگردان
    try {
      const created = await prisma.menu.create({
        data: { name, type },
      });
      return NextResponse.json(created, { status: 201 });
    } catch (err: any) {
      // Unique constraint (name + type) -> برگرداندن رکورد موجود
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const existing = await prisma.menu.findFirst({
          where: { name, type },
        });
        return NextResponse.json(existing, { status: 200 });
      }
      throw err;
    }
  } catch (e) {
    console.error("POST /api/menus error:", e);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
