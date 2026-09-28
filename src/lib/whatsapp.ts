import { formatDateTime, formatMoney, lineTotal, orderTotal } from "@/lib/format";
import { orderCode } from "@/lib/order-code";
import type { Order } from "@/lib/types";

/** El número sale de NEXT_PUBLIC_WHATSAPP_NUMBER. No queda escrito en el código. */
export function whatsappNumber(): string {
  return (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
}

export function whatsappLabel(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+${whatsappNumber()}`;
}

function shownMoney(value: number | null): string {
  return value == null ? "A confirmar" : formatMoney(value);
}

export function orderMessage(order: Order): string {
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = orderTotal(order);
  const lines = [
    "*NUEVO PEDIDO – Librería Mayorista Sofía*",
    `📅 ${formatDateTime(order.createdAt)}`,
    `🧾 Pedido N° ${orderCode(order)}`,
    "",
    `👤 Cliente: ${order.customerName}`,
    `🏪 Comercio: ${order.businessName.trim() || "—"}`,
    `🪪 CUIT: ${order.cuit.trim() || "—"}`,
    `📞 Teléfono: ${order.phone}`,
    `📍 Dirección: ${order.address.trim() || "—"}`,
    `🚚 Entrega: ${order.delivery === "envio" ? "Envío" : "Retiro en local"}`,
    "",
    "📦 *Detalle*",
  ];

  order.items.forEach((item, index) => {
    const subtotal = lineTotal(item.unitPrice, item.quantity);
    const unit = item.presentation.trim() || "unidad";
    lines.push(`${index + 1}. Cód. ${item.code.trim() || "—"}`);
    lines.push(item.name);
    lines.push(`${item.quantity} × ${unit} × ${shownMoney(item.unitPrice)} = ${shownMoney(subtotal)}`);
  });

  lines.push(
    "",
    `💰 Unidades: ${units}`,
    `*TOTAL: ${shownMoney(total)}*`,
    "",
    "📝 *Observaciones*",
    order.note.trim() || "Sin observaciones",
    "",
    "Gracias por tu pedido. Lo revisamos y te confirmamos por este chat.",
    "Precios y stock sujetos a confirmación.",
  );
  return lines.join("\n");
}

/** Abre wa.me con el texto ya codificado. Devuelve false si falta el número. */
export function openOrderOnWhatsApp(order: Order): boolean {
  const number = whatsappNumber();
  if (!number) return false;
  const url = `https://wa.me/${number}?text=${encodeURIComponent(orderMessage(order))}`;
  window.location.assign(url);
  return true;
}
