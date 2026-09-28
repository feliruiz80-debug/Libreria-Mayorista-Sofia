"use client";

import { buildOrderPdf } from "@/lib/order-pdf";
import { orderCode } from "@/lib/order-code";
import type { Order } from "@/lib/types";

/** Abre el PDF checklist en otra pestaña para imprimirlo. Si el navegador bloquea la ventana, lo descarga. */
export function openOrderChecklist(order: Order) {
  const pdf = buildOrderPdf(order);
  const bytes = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener");
  if (!popup) {
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedido-${orderCode(order)}.pdf`;
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
