import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId, addressId, gateway } = await req.json();

  if (!userId || !addressId) {
    return NextResponse.json({ error: 'userId و addressId لازم است' }, { status: 400 });
  }

  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });
  }

  const total = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      addressId,
      total,
      gateway: gateway || 'پرداخت آنلاین',
      status: 'PENDING',
      items: {
        create: cart.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          price: item.price,
        })),
      },
    },
    include: { items: true },
  });

  // خالی کردن سبد خرید
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return NextResponse.json(order);
}
