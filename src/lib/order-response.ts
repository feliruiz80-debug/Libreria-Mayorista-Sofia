import { buildOrderPdf } from "@/lib/order-pdf";
import type { Order } from "@/lib/types";

export function orderPdfResponse(order: Order): Response {
  const pdf = buildOrderPdf(order);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="nota-pedido.pdf"',
      "Cache-Control": "private, max-age=3600",
    },
  });
}
