"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatDateTime, formatMoney, orderTotal } from "@/lib/format";
import { saveOrderImage } from "@/lib/save-order-image";
import { orderCode } from "@/lib/order-code";
import { openOrderOnWhatsApp, whatsappLabel } from "@/lib/whatsapp";
import {
  getOrdersSnapshot,
  getServerOrdersSnapshot,
  subscribeOrders,
} from "@/lib/orders-storage";
import type { Order } from "@/lib/types";

export function OrdersView() {
  const orders = useSyncExternalStore(subscribeOrders, getOrdersSnapshot, getServerOrdersSnapshot);
  const label = whatsappLabel();

  function send(order: Order) {
    openOrderOnWhatsApp(order);
  }

  return (
    <div className="px-4 py-4">
      <p className="kicker">Archivo</p>
      <h1 className="display mt-1 text-4xl leading-none">Mis pedidos</h1>
      <p className="muted mt-2 text-sm">
        Quedan guardados en este navegador.
        {label ? ` Enviar abre de nuevo el chat ${label}.` : ""}
      </p>
      {orders.length === 0 ? (
        <div className="panel mt-6 px-4 py-10 text-center">
          <p className="muted">Todavía no confirmaste ningún pedido.</p>
          <Link href="/catalogo" className="btn btn-primary mt-4">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => {
            const total = orderTotal(order);
            return (
              <li key={order.id} className="panel p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{orderCode(order)}</p>
                  <p className="muted text-sm">{formatDateTime(order.createdAt)}</p>
                </div>
                <p className="mt-1 font-semibold">{order.customerName}</p>
                <p className="muted mt-1 text-sm">
                  {[order.businessName, order.cuit && `CUIT ${order.cuit}`, order.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-sm">
                  {order.delivery === "envio" ? "Envío" : "Retiro en local"}
                  {order.address ? ` · ${order.address}` : ""}
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.productId}`}>
                      {item.quantity} × {item.name}
                      {item.code ? ` (${item.code})` : ""}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 font-semibold">{total == null ? "Total a confirmar" : formatMoney(total)}</p>
                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={() => send(order)} className="btn btn-primary">
                    Enviar por WhatsApp
                  </button>
                  <button type="button" onClick={() => saveOrderImage(order)} className="btn btn-secondary">
                    Guardar PDF
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
