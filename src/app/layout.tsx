import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/components/CartProvider";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Librería Mayorista Sofía",
  description: "Catálogo y pedidos para clientes de Librería Mayorista Sofía.",
  applicationName: "Sofía",
  appleWebApp: {
    capable: true,
    title: "Sofía",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f1ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f6f1ea] text-[#1b1d21]">
        <CartProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-lg flex-1 pb-24">{children}</main>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}
