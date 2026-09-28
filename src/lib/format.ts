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

export function whatsAppShareUrl(order: Order): string {
  return `https://wa.me/?text=${encodeURIComponent(formatOrderText(order))}`;
}

export function formatOrderText(order: Order): string {
  const lines = [
    "Pedido — Librería Mayorista Sofía",
    `Fecha: ${formatDateTime(order.createdAt)}`,
    `Cliente: ${order.customerName}`,
  ];
  if (order.businessName.trim()) lines.push(`Comercio: ${order.businessName.trim()}`);
  lines.push(`Teléfono: ${order.phone}`);
  if (order.note.trim()) lines.push(`Nota: ${order.note.trim()}`);
  lines.push("");
  for (const item of order.items) {
    const price =
      item.unitPrice == null ? "precio a confirmar" : formatMoney(item.unitPrice);
    const subtotal = lineTotal(item.unitPrice, item.quantity);
    const code = item.code ? ` (${item.code})` : "";
    const presentation = item.presentation ? `, ${item.presentation}` : "";
    const subtotalText = subtotal == null ? "" : ` = ${formatMoney(subtotal)}`;
    lines.push(
      `${item.quantity} × ${item.name}${code}${presentation} — ${price}${subtotalText}`,
    );
  }
  lines.push("");
  const total = orderTotal(order);
  lines.push(total == null ? "Total: a confirmar" : `Total: ${formatMoney(total)}`);
  return lines.join("\n");
}
