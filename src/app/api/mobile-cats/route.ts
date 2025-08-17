// src/app/api/mobile-cats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { IconKey } from "@prisma/client";

// همیشه داینامیک و بدون کش
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PayloadItem = {
  id?: string;
  title: string;
  href: string;
  icon: IconKey | string;
  order?: number;
};
type Payload = PayloadItem[];

const MAX_ITEMS = 13 as const;
const ICONS: IconKey[] = [
  "brands","special","skincare","makeup","personalcare","hair",
  "electric","perfume","fashion","supplement","digital","magazine","jewelry",
];

const noStoreHeaders = { "Cache-Control": "no-store, no-cache, must-revalidate" } as const;

function normalizeIcon(v: string | IconKey): IconKey {
  const key = String(v) as IconKey;
  return ICONS.includes(key) ? key : "brands";
}
function cleanStr(s: unknown, def = ""): string {
  return (typeof s === "string" ? s : def).trim();
}
function isValidTitle(s: string) {
  return s.length > 0 && s.length <= 60;
}
function isValidHref(s: string) {
  // اجازه /... یا # یا http/https
  return /^([/#]|https?:\/\/)/i.test(s);
}

// GET: لیست مرتب‌شده
export async function GET() {
  const rows = await prisma.mobileCat.findMany({
    orderBy: { order: "asc" },
    select: { id: true, title: true, href: true, icon: true, order: true },
  });
  return NextResponse.json(rows, { headers: noStoreHeaders });
}

// PUT: جایگزینی کامل لیست
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Bad payload" }, { status: 400 });
    }
    if (body.length > MAX_ITEMS) {
      return NextResponse.json(
        { error: `حداکثر ${MAX_ITEMS} آیتم مجاز است` },
        { status: 422 }
      );
    }

    const data = body.map((raw, i) => {
      const title = cleanStr(raw.title);
      const href = cleanStr(raw.href, "#");
      const icon = normalizeIcon(raw.icon as any);
      const order = Number.isFinite(raw.order as any) ? Number(raw.order) : i;

      if (!isValidTitle(title)) {
        throw new Error("عنوان نامعتبر است (۱ تا ۶۰ کاراکتر).");
      }
      if (!isValidHref(href)) {
        throw new Error("لینک نامعتبر است (باید با / یا # یا http/https شروع شود).");
      }

      return { title, href, icon, order };
    });

    await prisma.$transaction(async (tx) => {
      await tx.mobileCat.deleteMany();
      if (data.length) {
        await tx.mobileCat.createMany({ data });
      }
    });

    const rows = await prisma.mobileCat.findMany({
      orderBy: { order: "asc" },
      select: { id: true, title: true, href: true, icon: true, order: true },
    });

    return NextResponse.json(rows, { headers: noStoreHeaders });
  } catch (e: any) {
    const msg = e?.message || "خطای داخلی سرور";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
