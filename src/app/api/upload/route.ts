import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs"; // مهم: رو Edge نباشه

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file لازم است" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".bin";
    const safeBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, "_")
      .slice(0, 50);
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${safeBase}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${filename}`; // همین رو بعداً تو Product ذخیره کن
    return NextResponse.json({ url }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
