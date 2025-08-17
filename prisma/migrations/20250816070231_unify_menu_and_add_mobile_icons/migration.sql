-- CreateEnum
CREATE TYPE "public"."MenuType" AS ENUM ('DESKTOP', 'MOBILE');

-- CreateEnum
CREATE TYPE "public"."IconKey" AS ENUM ('brands', 'special', 'skincare', 'makeup', 'personalcare', 'hair', 'electric', 'perfume', 'fashion', 'supplement', 'digital', 'magazine', 'jewelry');

-- CreateTable
CREATE TABLE "public"."SiteSetting" (
    "id" TEXT NOT NULL,
    "headerLogoUrl" TEXT,
    "mobileLogoUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Menu" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."MenuType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "icon" "public"."IconKey",
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Menu_name_type_key" ON "public"."Menu"("name", "type");

-- CreateIndex
CREATE INDEX "MenuItem_menuId_idx" ON "public"."MenuItem"("menuId");

-- CreateIndex
CREATE INDEX "MenuItem_parentId_idx" ON "public"."MenuItem"("parentId");

-- CreateIndex
CREATE INDEX "MenuItem_order_idx" ON "public"."MenuItem"("order");

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "public"."Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
