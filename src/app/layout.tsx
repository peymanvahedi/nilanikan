// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HeaderDesktop from "@/components/HeaderDesktop";
import HeaderMobile from "@/components/HeaderMobile";
// ⬅️ اضافه شد
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Nilanikan Store",
  description: "فروشگاه پوشاک کودک نیلا نیکان",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
        suppressHydrationWarning
      >
        {/* ⬅️ کل اپ داخل Provider */}
        <CartProvider>
          {/* Header */}
          <div className="md:hidden">
            <HeaderMobile />
          </div>
          <div className="hidden md:block">
            <HeaderDesktop />
          </div>

          {/* Page content */}
          <main className="min-h-screen">{children}</main>

          {/* Portal برای مودال‌ها در صورت نیاز */}
          <div id="portal-root" />
        </CartProvider>
      </body>
    </html>
  );
}
