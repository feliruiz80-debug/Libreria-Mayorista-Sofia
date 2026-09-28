import type { Order } from "@/lib/types";

const STORAGE_KEY = "sofia-orders-v1";
const EMPTY: Order[] = [];

let orders: Order[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

export function normalizeOrder(value: Partial<Order> | null | undefined): Order | null {
  if (!value || typeof value.id !== "string" || !Array.isArray(value.items)) return null;
  const delivery = value.delivery === "envio" ? "envio" : "retiro";
  const shipping =
    typeof value.shippingCost === "number" && Number.isFinite(value.shippingCost)
      ? Math.round(value.shippingCost)
      : null;
  return {
    id: value.id,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    customerName: String(value.customerName ?? ""),
    businessName: String(value.businessName ?? ""),
    phone: String(value.phone ?? ""),
    note: String(value.note ?? ""),
    estimatedShipDate: /^\d{4}-\d{2}-\d{2}$/.test(String(value.estimatedShipDate ?? ""))
      ? String(value.estimatedShipDate)
      : "",
    delivery,
    address: delivery === "envio" ? String(value.address ?? "") : "",
    shippingCost: delivery === "envio" ? shipping : null,
    items: value.items,
  };
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Order>[]) : EMPTY;
    orders = Array.isArray(parsed)
      ? parsed.flatMap((order) => {
          const normalized = normalizeOrder(order);
          return normalized ? [normalized] : [];
        })
      : EMPTY;
  } catch {
    orders = EMPTY;
  }
}

export function subscribeOrders(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOrdersSnapshot() {
  hydrate();
  return orders;
}

export function getServerOrdersSnapshot() {
  return EMPTY;
}

export function saveOrder(order: Order) {
  hydrate();
  orders = [order, ...orders];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  for (const listener of listeners) listener();
}
