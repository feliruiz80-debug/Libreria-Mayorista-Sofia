import { decodeOrder } from "@/lib/order-link";
import { buildOrderPdf } from "@/lib/order-pdf";

export async function GET(request: Request) {
  const payload = new URL(request.url).searchParams.get("d") ?? "";
  if (!payload || payload.length > 12000) {
    return new Response("Pedido inválido", { status: 400 });
  }
  const order = decodeOrder(payload);
  if (!order || order.items.length === 0) {
    return new Response("Pedido inválido", { status: 400 });
  }
  const pdf = buildOrderPdf(order);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="pedido-sofia.pdf"',
      "Cache-Control": "private, max-age=3600",
    },
  });
}
