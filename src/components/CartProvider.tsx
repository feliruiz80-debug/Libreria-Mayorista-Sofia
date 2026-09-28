"use client";

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createContext, useContext } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "sofia-cart-v1";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function sanitize(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return EMPTY;
  const next = value.filter(
    (item): item is CartItem =>
      !!item &&
      typeof item === "object" &&
      typeof (item as CartItem).productId === "string" &&
      typeof (item as CartItem).quantity === "number" &&
      Number.isFinite((item as CartItem).quantity) &&
      (item as CartItem).quantity > 0,
  );
  return next.length > 0 ? next : EMPTY;
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    items = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  hydrate();
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

function commit(next: CartItem[]) {
  items = next.length > 0 ? next : EMPTY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  for (const listener of listeners) listener();
}

const CartContext = createContext<{
  items: CartItem[];
  count: number;
  quantityOf: (productId: string) => number;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();
    if (quantity <= 0) {
      commit(current.filter((item) => item.productId !== productId));
      return;
    }
    const existing = current.find((item) => item.productId === productId);
    commit(
      existing
        ? current.map((item) => (item.productId === productId ? { ...item, quantity } : item))
        : [...current, { productId, quantity }],
    );
  }, []);

  const remove = useCallback((productId: string) => {
    commit(getSnapshot().filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => {
    commit(EMPTY);
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      items,
      count,
      quantityOf: (productId: string) =>
        items.find((item) => item.productId === productId)?.quantity ?? 0,
      setQuantity,
      remove,
      clear,
    };
  }, [items, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart tiene que usarse dentro de CartProvider.");
  return value;
}
