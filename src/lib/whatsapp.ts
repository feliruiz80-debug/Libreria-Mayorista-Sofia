import { formatDateTime, formatMoney, lineTotal, orderTotal } from "@/lib/format";
import { orderCode } from "@/lib/order-code";
import type { Order } from "@/lib/types";

/**
 * WhatsApp de la librería: 351 676-8638.
 * En Argentina el enlace lleva 54 y el 9 de celular: 5493516768638.
 * NEXT_PUBLIC_WHATSAPP_NUMBER puede reemplazarlo si hace falta otro número.
 */
const WHATSAPP_NUMBER = "5493516768638";

/** Lleva 3516768638, 543516768638 o 5493516768638 al formato que abre wa.me. */
export function toWhatsAppDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  if (!digits) return "";
  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  return `549${digits}`;
}

export function whatsappNumber(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  return toWhatsAppDigits(fromEnv || WHATSAPP_NUMBER);
}

export function whatsappLabel(): string {
  const digits = whatsappNumber();
  if (!digits) return "";
  if (digits.startsWith("549") && digits.length > 6) {
    const local = digits.slice(3);
    const area = local.slice(0, 3);
    const rest = local.slice(3);
    const pretty = rest.length > 4 ? `${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}` : rest;
    return `+54 ${area} ${pretty}`.trim();
  }
  return `+${digits}`;
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
