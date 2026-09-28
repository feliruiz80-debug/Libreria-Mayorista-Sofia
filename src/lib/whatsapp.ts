import { formatShipDate } from "@/lib/format";
import { buildOrderPdf } from "@/lib/order-pdf";
import type { Order } from "@/lib/types";

/** Córdoba, formato de WhatsApp: 54 9 351 676-8638. */
export const STORE_WHATSAPP = "5493516768638";
export const STORE_WHATSAPP_LABEL = "351 676-8638";

function fileName(order: Order): string {
  const safe = order.customerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `nota-pedido-${safe || "sofia"}.pdf`;
}

export function orderMessage(order: Order): string {
  const date = order.estimatedShipDate
    ? formatShipDate(order.estimatedShipDate)
    : "a coordinar";
  return `Hola Felipe, ¿cómo estás? Este es mi pedido.\nFecha de envío estimada: ${date}`;
}

/** Manda el mensaje y el PDF como archivo. No incluye ningún link. */
export async function sendOrderPdf(order: Order): Promise<"shared" | "downloaded"> {
  const file = new File([new Uint8Array(buildOrderPdf(order))], fileName(order), {
    type: "application/pdf",
  });
  const text = orderMessage(order);
  const withFile = { text, files: [file] };
  try {
    if (typeof navigator !== "undefined" && navigator.canShare?.(withFile)) {
      await navigator.share(withFile);
      return "shared";
    }
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
