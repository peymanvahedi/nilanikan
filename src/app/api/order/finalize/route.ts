// src/app/api/order/finalize/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const bad = (msg: string, code = 400) => NextResponse.json({ error: msg }, { status: code });

// Retry کوتاه برای خطاهای Serialization/Deadlock در Postgres
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      if (e?.code === "P2034" || /Serialization|Deadlock|could not serialize/i.test(String(e))) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;
  const cartId = body?.cartId as string | undefined;
  if (!orderId) return bad("orderId لازم است");

  try {
    const result = await withRetry(async () =>
      prisma.$transaction(
        async (tx) => {
          // سفارش با آیتم‌ها + محصولات
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } } },
          });
          if (!order) return { ok: false, status: 404, error: "سفارش یافت نشد" } as const;
          if (!order.items.length) return { ok: false, status: 400, error: "سفارش آیتم ندارد" } as const;

          // اگر قبلاً بسته شده، از دوباره‌کاری جلوگیری کن
          if (["PAID", "FAILED", "CANCELED", "SENT", "DELIVERED"].includes(order.status as string)) {
            return { ok: true, alreadyFinalized: true } as const;
          }

          // 1) چک موجودی
          for (const it of order.items) {
            const stock = it.product?.stock ?? 0;
            if (stock < it.qty) {
              return {
                ok: false,
                status: 409,
                error: `موجودی کافی نیست: ${it.product?.title ?? it.productId}`,
              } as const;
            }
          }

          // 2) قفل موجودی (کاهش stock)
          for (const it of order.items) {
            await tx.product.update({
              where: { id: it.productId },
              data: { stock: { decrement: it.qty } },
            });
          }

          // 3) بستن سبد (با فیلدهای جدید checkedOut/checkedOutAt)
          if (cartId) {
            await tx.cart.update({
              where: { id: cartId },
              data: { checkedOut: true, checkedOutAt: new Date() },
            });
            await tx.cartItem.deleteMany({ where: { cartId } });
          }

          // 4) در صورت داشتن وضعیت اختصاصی AWAITING_COD، این خط را باز کن:
          // await tx.order.update({ where: { id: orderId }, data: { status: "AWAITING_COD" } });

          return { ok: true } as const;
        },
        { isolationLevel: "Serializable" }
      )
    );

    if (!("ok" in result) || !result.ok) {
      return NextResponse.json({ error: (result as any).error }, { status: (result as any).status ?? 500 });
    }

    return NextResponse.json({ ok: true, alreadyFinalized: (result as any).alreadyFinalized ?? false });
  } catch (e) {
    console.error(e);
    return bad("خطا در نهایی‌سازی", 500);
  }
}
