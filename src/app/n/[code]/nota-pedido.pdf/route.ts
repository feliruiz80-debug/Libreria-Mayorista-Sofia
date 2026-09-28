import { decodeOrder } from "@/lib/order-link";
import { orderPdfResponse } from "@/lib/order-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code || code.length > 12000) {
    return new Response("Pedido inválido", { status: 400 });
  }
  const order = decodeOrder(decodeURIComponent(code));
  if (!order || order.items.length === 0) {
    return new Response("Pedido inválido", { status: 400 });
  }
  return orderPdfResponse(order);
}
