import type { Order, OrderLine } from "@/lib/types";

type CompactOrder = {
  n: string;
  b: string;
  p: string;
  o: string;
  t: string;
  i: Array<[string, string, string, number, number | null]>;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeOrder(order: Order): string {
  const compact: CompactOrder = {
    n: order.customerName,
    b: order.businessName,
    p: order.phone,
    o: order.note,
    t: order.createdAt,
    i: order.items.map((item) => [
      item.name,
      item.code,
      item.presentation,
      item.quantity,
      item.unitPrice,
    ]),
  };
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(compact)));
}

export function decodeOrder(value: string): Order | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))) as CompactOrder;
    if (!parsed || !Array.isArray(parsed.i) || typeof parsed.n !== "string") return null;
    const items: OrderLine[] = parsed.i.slice(0, 80).map((item, index) => ({
      productId: `linea-${index}`,
      name: String(item[0] ?? "").slice(0, 180),
      code: String(item[1] ?? "").slice(0, 40),
      presentation: String(item[2] ?? "").slice(0, 40),
      quantity: Number(item[3]) > 0 ? Math.min(9999, Math.round(Number(item[3]))) : 1,
      unitPrice: item[4] == null || Number.isNaN(Number(item[4])) ? null : Number(item[4]),
    }));
    return {
      id: "pdf",
      createdAt: typeof parsed.t === "string" ? parsed.t : new Date().toISOString(),
      customerName: parsed.n.slice(0, 120),
      businessName: String(parsed.b ?? "").slice(0, 120),
      phone: String(parsed.p ?? "").slice(0, 40),
      note: String(parsed.o ?? "").slice(0, 400),
      items,
    };
  } catch {
    return null;
  }
}
