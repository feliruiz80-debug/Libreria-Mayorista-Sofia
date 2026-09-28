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

export async function shareOrderPdf(order: Order): Promise<"shared" | "downloaded"> {
  const file = new File([new Uint8Array(buildOrderPdf(order))], fileName(order), {
    type: "application/pdf",
  });
  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return "shared";
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
