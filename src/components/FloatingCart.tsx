"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";

export function FloatingCart() {
  const pathname = usePathname();
  const { items, count } = useCart();
  if (pathname === "/carrito" || count === 0) return null;

  const priced = items.every((item) => item.unitPrice != null);
  const total = priced ? items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0) : null;

  return (
    <Link
      href="/carrito"
      className="float-chip flex min-h-11 items-center justify-between gap-3 px-2 py-1"
      aria-label={`Ver pedido, ${count} productos`}
    >
      <span className="text-sm font-semibold">
        {count} {count === 1 ? "producto" : "productos"}
      </span>
      <span className="text-base font-semibold">{total == null ? "A confirmar" : formatMoney(total)}</span>
    </Link>
  );
}
