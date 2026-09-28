"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { formatDateTime, formatMoney, orderPayable, orderTotal } from "@/lib/format";
import { openOrderOnWhatsApp, STORE_WHATSAPP_LABEL } from "@/lib/whatsapp";
import {
  getOrdersSnapshot,
  getServerOrdersSnapshot,
  subscribeOrders,
} from "@/lib/orders-storage";
import type { Order } from "@/lib/types";

export function OrdersView() {
  const orders = useSyncExternalStore(subscribeOrders, getOrdersSnapshot, getServerOrdersSnapshot);
  const [notice, setNotice] = useState("");

  function send(order: Order) {
    setNotice("");
    try {
      openOrderOnWhatsApp(order);
    } catch {
      setNotice("No se pudo abrir el WhatsApp de la librería.");
    }
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-3xl font-semibold tracking-tight">Mis pedidos</h1>
      <p className="mt-2 text-sm text-[#6f675f]">
        Quedan guardados en este navegador. Podés volver a abrir el chat {STORE_WHATSAPP_LABEL}{" "}
        con la nota lista para enviar.
      </p>
      {notice ? (
        <p className="mt-4 rounded-2xl bg-[#e7f6f2] px-4 py-3 text-sm text-[#0d6b60]">{notice}</p>
      ) : null}
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
            const subtotal = orderTotal(order);
            const payable = orderPayable(order);
            const shipping =
              order.delivery === "envio"
                ? order.shippingCost == null
                  ? "A coordinar"
                  : formatMoney(order.shippingCost)
                : "Retiro en el local";
            return (
              <li key={order.id} className="rounded-2xl border border-black/5 bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-[#6f675f]">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-[#6f675f]">
                  {[order.businessName, order.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-sm text-[#3a3532]">
                  {order.delivery === "envio"
                    ? `Envío a ${order.address || "domicilio"} · ${shipping}`
                    : "Retiro en el local"}
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.productId}`}>
                      {item.quantity} × {item.name}
                      {item.code ? ` (${item.code})` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-[#6f675f]">
                  Subtotal {subtotal == null ? "a confirmar" : formatMoney(subtotal)} · Envío{" "}
                  {shipping}
                </p>
                <p className="font-semibold">
                  {payable == null ? "Total a confirmar" : formatMoney(payable)}
                </p>
                <button
                  type="button"
                  onClick={() => send(order)}
                  className="mt-4 rounded-full bg-[#128C7E] px-4 py-2 text-sm font-semibold text-white"
                >
                  Enviar a {STORE_WHATSAPP_LABEL}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
