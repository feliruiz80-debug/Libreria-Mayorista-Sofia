import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/components/CartProvider";
import { FloatingCart } from "@/components/FloatingCart";
import { SiteHeader } from "@/components/SiteHeader";
import { UpdateButton } from "@/components/UpdateButton";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-[var(--color-text)]">
        <CartProvider>
          <UpdateButton />
          <SiteHeader />
          <main className="mx-auto w-full max-w-lg flex-1 pb-40">{children}</main>
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
            <div className="pointer-events-auto mx-auto grid max-w-lg">
              <FloatingCart />
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
            </div>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
