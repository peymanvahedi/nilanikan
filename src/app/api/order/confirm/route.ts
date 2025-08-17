// src/app/api/order/confirm/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  orderId: string;
  fullName: string;
  phone: string;
  city?: string;
  line1: string;
  postal?: string;
  // اگر کاربر لاگین است، می‌توانید userId را از سشن بردارید
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { orderId, fullName, phone, city, line1, postal, userId } = body;

    if (!orderId || !fullName || !phone || !line1) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });

    // اگر آدرس مستقل دارید و userId معلوم نیست، می‌توانیم آدرس را نیز بدون user ذخیره نکنیم.
    // اینجا برای سادگی اگر userId نداریم، یک کاربر هم نیاز نیست؛ آدرس مستقل می‌سازیم؟
    // طبق مدل شما Address نیاز به userId دارد؛ پس اگر userId ندارید، یا:
    //   1) از کاربر مهمان یک user بسازید؛ یا
    //   2) آدرس را روی خود Order بدون Address ذخیره کنید.
    // برای سازگاری با مدل فعلی (Address به user وابسته است)، اگر userId نداریم آدرس نمی‌سازیم
    // و فقط فیلدهای ساده را روی Order نمی‌توانیم ذخیره کنیم چون Order آن‌ها را ندارد.
    // راه ساده: اگر userId موجود نیست، یک کاربر مهمان بسازیم.

    let finalUserId = order.userId ?? userId ?? null;
    if (!finalUserId) {
      const guest = await prisma.user.create({
        data: {
          name: fullName,
          mobile: phone,
          role: "CUSTOMER",
        },
        select: { id: true },
      });
      finalUserId = guest.id;
    }

    // ساخت آدرس
    const address = await prisma.address.create({
      data: {
        userId: finalUserId!,
        province: "", // اگر دارید از فرم بگیرید
        city: city ?? "",
        line1,
        postal: postal ?? "",
      },
      select: { id: true },
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        userId: finalUserId!,
        addressId: address.id,
        status: "PENDING", // می‌تونید همینجا "AWAITING_COD" تعریف کنید؛ enum فعلی شما این مقدار را ندارد
        // پیشنهاد: به enum OrderStatus مقدار AWAITING_COD اضافه کنید
      },
      select: { id: true, status: true, total: true },
    });

    return NextResponse.json({ ok: true, orderId: updated.id, status: updated.status, total: updated.total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "خطا در تایید سفارش" }, { status: 500 });
  }
}
