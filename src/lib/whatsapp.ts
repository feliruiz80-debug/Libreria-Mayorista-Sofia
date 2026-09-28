import { formatOrderText } from "@/lib/format";
import { encodeOrder } from "@/lib/order-link";
import type { Order } from "@/lib/types";

/** Córdoba, formato de WhatsApp: 54 9 351 676-8638. */
export const STORE_WHATSAPP = "5493516768638";
export const STORE_WHATSAPP_LABEL = "351 676-8638";

export function storeWhatsAppUrl(order: Order, origin: string): string {
  const pdfLink = `${origin}/api/pedido?d=${encodeOrder(order)}`;
  const full = `${formatOrderText(order)}\n\nPDF del pedido:\n${pdfLink}`;
  const text =
    full.length > 3500 ? `Pedido de ${order.customerName}.\nPDF del pedido:\n${pdfLink}` : full;
  return `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export function openStoreWhatsApp(order: Order) {
  window.location.href = storeWhatsAppUrl(order, window.location.origin);
}
