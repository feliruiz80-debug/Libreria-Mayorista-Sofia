import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  description:
    "Catálogo y pedidos para clientes de Librería Mayorista Sofía, con precios desde Google Sheets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f7f4ef] text-[#1b1d21]">
        <CartProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
