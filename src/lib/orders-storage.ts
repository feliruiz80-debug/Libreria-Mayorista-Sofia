import type { Order } from "@/lib/types";

const STORAGE_KEY = "sofia-orders-v1";
const EMPTY: Order[] = [];

let orders: Order[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Order[]) : EMPTY;
    orders = Array.isArray(parsed) && parsed.length > 0 ? parsed : EMPTY;
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
