import type { Order } from "@/lib/types";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatMoney(value: number): string {
  return money.format(value);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateTime.format(date);
}

export function lineTotal(unitPrice: number | null, quantity: number): number | null {
  if (unitPrice == null) return null;
  return unitPrice * quantity;
}

export function orderTotal(order: Pick<Order, "items">): number | null {
  let total = 0;
  for (const item of order.items) {
    if (item.unitPrice == null) return null;
    total += item.unitPrice * item.quantity;
  }
  return total;
}

export function orderPayable(order: Order): number | null {
  const subtotal = orderTotal(order);
  if (subtotal == null) return null;
  if (order.delivery === "envio" && order.shippingCost == null) return null;
  return subtotal + (order.delivery === "envio" ? (order.shippingCost ?? 0) : 0);
}

/** Importe en formato argentino. Vacío es null (a coordinar). */
export function parseAmount(value: string): { ok: true; amount: number | null } | { ok: false } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, amount: null };
  const cleaned = trimmed.replace(/\$/g, "").replace(/\s/g, "");
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(cleaned)) return { ok: false };
  const amount = Number(cleaned.replaceAll(".", "").replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return { ok: false };
  return { ok: true, amount: Math.round(amount) };
}
