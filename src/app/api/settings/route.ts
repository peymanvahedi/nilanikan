// GET: خواندن تنظیمات لوگوها
// PUT: به‌روزرسانی تنظیمات لوگوها
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await prisma.siteSetting.findFirst();
  return NextResponse.json(s ?? {});
}

export async function PUT(req: Request) {
  const { headerLogoUrl, mobileLogoUrl } = await req.json();
  const curr = await prisma.siteSetting.findFirst();
  const data = { headerLogoUrl: headerLogoUrl ?? null, mobileLogoUrl: mobileLogoUrl ?? null };
  const saved = curr
    ? await prisma.siteSetting.update({ where: { id: curr.id }, data })
    : await prisma.siteSetting.create({ data });
  return NextResponse.json(saved);
}
