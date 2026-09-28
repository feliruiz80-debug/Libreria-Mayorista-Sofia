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

function orderReference(order: Order): string {
  const date = new Date(order.createdAt);
  const stamp = Number.isNaN(date.getTime())
    ? "00000000"
    : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tail = order.id.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "0000";
  return `NP-${stamp}-${tail}`;
}

function shownMoney(value: number | null): string {
  return value == null ? "A confirmar" : formatMoney(value);
}

export function orderMessage(order: Order): string {
  const lines = [
    "*NOTA DE PEDIDO*",
    "Librería Mayorista Sofía",
    `N.º ${orderReference(order)}`,
    formatDateTime(order.createdAt),
    "",
    "Hola Felipe, ¿cómo estás? Este es mi pedido.",
    "",
    "*Cliente*",
    order.customerName,
  ];
  if (order.businessName.trim()) lines.push(order.businessName.trim());
  lines.push(`Tel. ${order.phone}`);
  lines.push("", "*Entrega*");
  if (order.delivery === "envio") {
    lines.push("Envío a domicilio");
    if (order.address.trim()) lines.push(order.address.trim());
    lines.push(
      `Costo de envío: ${order.shippingCost == null ? "A coordinar" : formatMoney(order.shippingCost)}`,
    );
  } else {
    lines.push("Retiro en el local");
  }
  lines.push(
    `Fecha estimada: ${order.estimatedShipDate ? formatShipDate(order.estimatedShipDate) : "A coordinar"}`,
  );
  if (order.note.trim()) {
    lines.push("", "*Observación*", order.note.trim());
  }
  lines.push("", "*Productos*");
  order.items.forEach((item, index) => {
    const detail = [item.code ? `Cód. ${item.code}` : "", item.presentation]
      .filter(Boolean)
      .join(" · ");
    const subtotal = lineTotal(item.unitPrice, item.quantity);
    lines.push(`${index + 1}. ${item.name}`);
    if (detail) lines.push(detail);
    lines.push(
      `${item.quantity} × ${shownMoney(item.unitPrice)} = ${shownMoney(subtotal)}`,
    );
  });
  lines.push("", "*Totales*");
  lines.push(`Subtotal: ${shownMoney(orderTotal(order))}`);
  lines.push(
    order.delivery === "envio"
      ? `Envío: ${order.shippingCost == null ? "A coordinar" : formatMoney(order.shippingCost)}`
      : "Envío: Retiro en el local",
  );
  lines.push(`*Total: ${shownMoney(orderPayable(order))}*`);
  lines.push("", "Gracias. Quedo a la espera de la confirmación.");
  return lines.join("\n");
}

/** Igual que Bebu: abre el chat de la librería con la nota ya escrita. */
export function openOrderOnWhatsApp(order: Order) {
  const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(orderMessage(order))}`;
  window.location.assign(url);
}
