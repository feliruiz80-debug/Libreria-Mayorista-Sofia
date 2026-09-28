import {
  formatDateTime,
  formatMoney,
  formatShipDate,
  lineTotal,
  orderPayable,
  orderTotal,
} from "@/lib/format";
import type { Order } from "@/lib/types";

/**
 * Celular de Córdoba. WhatsApp pide el 9 después del 54:
 * +54 351 676-8638 se abre como 5493516768638.
 */
export const STORE_WHATSAPP = "5493516768638";
export const STORE_WHATSAPP_LABEL = "+54 351 676-8638";

export function orderMessage(order: Order): string {
  const lines = [
    "Hola Felipe, ¿cómo estás? Este es mi pedido.",
    "",
    "Nota de pedido — Librería Mayorista Sofía",
    `Fecha: ${formatDateTime(order.createdAt)}`,
    `Cliente: ${order.customerName}`,
  ];
  if (order.businessName.trim()) lines.push(`Comercio: ${order.businessName.trim()}`);
  lines.push(`Teléfono: ${order.phone}`);
  if (order.delivery === "envio") {
    lines.push("Entrega: Envío a domicilio");
    if (order.address.trim()) lines.push(`Dirección: ${order.address.trim()}`);
    lines.push(
      `Costo de envío: ${order.shippingCost == null ? "A coordinar" : formatMoney(order.shippingCost)}`,
    );
  } else {
    lines.push("Entrega: Retiro en el local");
  }
  lines.push(
    `Fecha de envío estimada: ${
      order.estimatedShipDate ? formatShipDate(order.estimatedShipDate) : "a coordinar"
    }`,
  );
  if (order.note.trim()) lines.push(`Nota: ${order.note.trim()}`);
  lines.push("");
  for (const item of order.items) {
    const price = item.unitPrice == null ? "precio a confirmar" : formatMoney(item.unitPrice);
    const subtotal = lineTotal(item.unitPrice, item.quantity);
    const code = item.code ? ` (${item.code})` : "";
    const presentation = item.presentation ? `, ${item.presentation}` : "";
    const subtotalText = subtotal == null ? "" : ` = ${formatMoney(subtotal)}`;
    lines.push(`${item.quantity} × ${item.name}${code}${presentation} — ${price}${subtotalText}`);
  }
  lines.push("");
  const subtotal = orderTotal(order);
  const total = orderPayable(order);
  lines.push(subtotal == null ? "Subtotal: a confirmar" : `Subtotal: ${formatMoney(subtotal)}`);
  if (order.delivery === "envio") {
    lines.push(
      `Envío: ${order.shippingCost == null ? "a coordinar" : formatMoney(order.shippingCost)}`,
    );
  }
  lines.push(total == null ? "Total: a confirmar" : `Total: ${formatMoney(total)}`);
  return lines.join("\n");
}

/** Igual que Bebu: abre el chat de la librería con la nota ya escrita. */
export function openOrderOnWhatsApp(order: Order) {
  const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(orderMessage(order))}`;
  window.location.assign(url);
}
