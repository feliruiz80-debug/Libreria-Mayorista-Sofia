import { encodeOrder } from "@/lib/order-link";
import type { Order } from "@/lib/types";

/** Córdoba, formato de WhatsApp: 54 9 351 676-8638. */
export const STORE_WHATSAPP = "5493516768638";
export const STORE_WHATSAPP_LABEL = "351 676-8638";

/** Abre WhatsApp ya en el chat de la librería, con la nota lista para enviar. */
export function openOrderOnWhatsApp(order: Order) {
  const note = new URL(`/n/${encodeOrder(order)}/nota-pedido.pdf`, window.location.origin);
  const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(note.href)}`;
  window.location.assign(url);
}
