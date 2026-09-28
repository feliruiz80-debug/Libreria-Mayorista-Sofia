"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/carrito", label: "Pedido" },
  { href: "/pedidos", label: "Mis pedidos" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f7f4ef]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.webp"
            alt="Librería Mayorista Sofía"
            width={3888}
            height={1312}
            priority
            className="h-11 w-auto max-w-[9.5rem] object-contain object-left"
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 font-medium transition ${
                  active
                    ? "bg-[#e92026] text-white"
                    : "text-[#3a3532] hover:bg-white"
                }`}
              >
                {link.label}
                {link.href === "/carrito" && count > 0 ? (
                  <span
                    className={`ml-1.5 inline-flex min-w-5 justify-center rounded-full px-1.5 text-xs ${
                      active ? "bg-white text-[#e92026]" : "bg-[#e92026] text-white"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
