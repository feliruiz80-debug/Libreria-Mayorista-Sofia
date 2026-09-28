"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import {
  formatDateTime,
  formatMoney,
  formatOrderText,
  orderTotal,
  whatsAppShareUrl,
} from "@/lib/format";
import {
  getOrdersSnapshot,
  getServerOrdersSnapshot,
  subscribeOrders,
} from "@/lib/orders-storage";
import type { Order } from "@/lib/types";

export function OrdersView() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("nuevo");
  const orders = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getServerOrdersSnapshot,
  );
  const [copiedId, setCopiedId] = useState("");

  async function copy(order: Order) {
    await navigator.clipboard.writeText(formatOrderText(order));
    setCopiedId(order.id);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Mis pedidos</h1>
      <p className="mt-2 text-sm text-[#6f675f]">
        Quedan guardados en este navegador. Copiá el texto o abrilo en WhatsApp para enviarlo a
        la librería.
      </p>
      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-10 text-center">
          <p className="text-[#6f675f]">Todavía no confirmaste ningún pedido.</p>
          <Link
            href="/catalogo"
            className="mt-4 inline-flex rounded-full bg-[#e92026] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const total = orderTotal(order);
            const fresh = order.id === highlight;
            return (
              <li
                key={order.id}
                className={`rounded-2xl border bg-white p-5 ${
                  fresh ? "border-[#e92026]" : "border-black/5"
                }`}
              >
                {fresh ? (
                  <p className="mb-2 text-sm font-semibold text-[#e92026]">Pedido armado</p>
                ) : null}
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-[#6f675f]">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-[#6f675f]">
                  {[order.businessName, order.phone].filter(Boolean).join(" · ")}
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.productId}`}>
                      {item.quantity} × {item.name}
                      {item.code ? ` (${item.code})` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-semibold">
                  {total == null ? "Total a confirmar" : formatMoney(total)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copy(order)}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold"
                  >
                    {copiedId === order.id ? "Copiado" : "Copiar pedido"}
                  </button>
                  <a
                    href={whatsAppShareUrl(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-[#1b1d21] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Enviar por WhatsApp
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
