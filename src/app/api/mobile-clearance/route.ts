import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = { id?: string; title: string; href: string; image?: string | null; price?: number | null; oldPrice?: number | null; order?: number };
const noStore = { "Cache-Control": "no-store, no-cache, must-revalidate" } as const;

export async function GET() {
  const rows = await prisma.mobileClearance.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, href: true, image: true, price: true, oldPrice: true, order: true },
  });
  return NextResponse.json(rows, { headers: noStore });
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Row[];
    if (!Array.isArray(body)) return NextResponse.json({ error: "Bad payload" }, { status: 400 });

    const data = body.map((b, i) => ({
      title: String(b.title || "").trim(),
      href: String(b.href || "#").trim(),
      image: b.image ? String(b.image).trim() : null,
      price: b.price != null ? Number(b.price) : null,
      oldPrice: b.oldPrice != null ? Number(b.oldPrice) : null,
      order: Number.isFinite(b.order as any) ? Number(b.order) : i,
    }));

    for (const d of data) {
      if (!d.title) return NextResponse.json({ error: "عنوان الزامی است" }, { status: 422 });
      if (!/^([/#]|https?:\/\/)/i.test(d.href)) return NextResponse.json({ error: "لینک نامعتبر" }, { status: 422 });
      if (d.price != null && d.price < 0) return NextResponse.json({ error: "قیمت نامعتبر" }, { status: 422 });
      if (d.oldPrice != null && d.oldPrice < 0) return NextResponse.json({ error: "قیمت قبلی نامعتبر" }, { status: 422 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.mobileClearance.deleteMany();
      if (data.length) await tx.mobileClearance.createMany({ data });
    });

    const rows = await prisma.mobileClearance.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(rows, { headers: noStore });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
