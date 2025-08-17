export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getProductTemplate, saveProductTemplate } from "../../../../server/fsdb";

export async function GET() {
  const tpl = await getProductTemplate();
  return NextResponse.json({ tpl });
}
export async function POST(req: Request) {
  const { tpl } = await req.json();
  if (typeof tpl !== "string") return NextResponse.json({ error: "tpl لازم است" }, { status: 400 });
  await saveProductTemplate(tpl);
  return NextResponse.json({ ok: true });
}
