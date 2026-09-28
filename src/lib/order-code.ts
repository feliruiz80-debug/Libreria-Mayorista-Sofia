import type { Order } from "@/lib/types";

/** Código corto y estable: fecha del pedido más cuatro caracteres del id. */
export function orderCode(order: Pick<Order, "id" | "createdAt">): string {
  const date = new Date(order.createdAt);
  const stamp = Number.isNaN(date.getTime())
    ? "00000000"
    : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tail = order.id.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "0000";
  return `NP-${stamp}-${tail}`;
}
