// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { cartId } = await req.json();

    if (!cartId) {
      return NextResponse.json({ error: "cartId لازم است" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "سبد یافت نشد یا خالی است" }, { status: 404 });
    }

    // محاسبه مبلغ جمع: از قیمت ذخیره‌شده در CartItem استفاده می‌کنیم
    const total = cart.items.reduce((sum, it) => {
      const unit = it.price ?? it.product?.price ?? 0;
      return sum + unit * (it.qty ?? 1);
    }, 0);

    // اگر موجودی محصول مهم است، اینجا بررسی کنید (اختیاری MVP)
    // for (const it of cart.items) {
    //   if ((it.product?.stock ?? 0) < it.qty) {
    //     return NextResponse.json({ error: `موجودی کافی نیست: ${it.product?.title}` }, { status: 409 });
    //   }
    // }

    const order = await prisma.order.create({
      data: {
        userId: cart.userId ?? null,
        status: "PENDING",
        total,
        gateway: "cod", // پرداخت درب منزل
        // هنوز addressId نداریم؛ در مرحله confirm ست می‌شود
        items: {
          create: cart.items.map((it) => ({
            productId: it.productId,
            qty: it.qty,
            price: it.price ?? it.product?.price ?? 0,
          })),
        },
      },
      select: { id: true, total: true },
    });

    return NextResponse.json({ orderId: order.id, total: order.total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "checkout خطا" }, { status: 500 });
  }
}
