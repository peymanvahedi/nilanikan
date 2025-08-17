import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const where = q ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }] } : {};
  const items = await prisma.brand.findMany({ where, orderBy: { name: 'asc' } });
  return NextResponse.json({ items, total: items.length });
}
