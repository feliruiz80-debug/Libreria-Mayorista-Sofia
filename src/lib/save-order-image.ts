"use client";

import { formatDateTime, formatMoney, lineTotal, orderTotal } from "@/lib/format";
import { orderCode } from "@/lib/order-code";
import { quantityLabel } from "@/lib/selling-unit";
import type { Order } from "@/lib/types";

const WIDTH = 1080;
const CREAM = "#f6f1ea";
const BLUE = "#014d9b";
const INK = "#1b1d21";

function money(value: number | null): string {
  return value == null ? "A confirmar" : formatMoney(value);
}

/** Arma una foto del pedido para que el celular la guarde en Imágenes. */
function drawOrderImage(order: Order): HTMLCanvasElement {
  const itemHeight = 108;
  const height = 520 + order.items.length * itemHeight + 220;
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, WIDTH, 220);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 28px Arial";
  ctx.fillText("LIBRERÍA MAYORISTA SOFÍA", 56, 78);
  ctx.font = "700 48px Arial";
  ctx.fillText("PEDIDO", 56, 142);
  ctx.font = "600 26px Arial";
  ctx.textAlign = "right";
  ctx.fillText(orderCode(order), WIDTH - 56, 86);
  ctx.font = "400 24px Arial";
  ctx.fillText(formatDateTime(order.createdAt), WIDTH - 56, 126);
  ctx.fillText(order.delivery === "envio" ? "Envío" : "Retiro en local", WIDTH - 56, 164);
  ctx.textAlign = "left";

  ctx.fillStyle = INK;
  ctx.font = "700 28px Arial";
  let y = 280;
  const rows = [
    order.customerName,
    order.businessName || "Sin comercio",
    order.cuit ? `CUIT ${order.cuit}` : "Sin CUIT",
    order.phone,
    order.address,
  ];
  for (const row of rows) {
    ctx.font = "400 30px Arial";
    ctx.fillText(row, 56, y);
    y += 42;
  }

  y += 24;
  ctx.font = "700 26px Arial";
  ctx.fillStyle = BLUE;
  ctx.fillText("Detalle", 56, y);
  y += 28;

  order.items.forEach((item, index) => {
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3;
    ctx.strokeRect(56, y, 28, 28);
    ctx.fillStyle = INK;
    ctx.font = "700 28px Arial";
    ctx.fillText(`${index + 1}. ${item.code || "Sin código"}`, 100, y + 24);
    ctx.font = "400 26px Arial";
    const name = item.name.length > 48 ? `${item.name.slice(0, 45)}...` : item.name;
    ctx.fillText(name, 100, y + 60);
    const subtotal = lineTotal(item.unitPrice, item.quantity);
    ctx.fillText(
      `${quantityLabel(item.presentation, item.quantity)}  ·  ${money(item.unitPrice)}  ·  ${money(subtotal)}`,
      100,
      y + 94,
    );
    y += itemHeight;
  });

  y += 20;
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = orderTotal(order);
  ctx.fillStyle = BLUE;
  ctx.fillRect(56, y, WIDTH - 112, 120);
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 30px Arial";
  ctx.fillText(`Unidades: ${units}`, 84, y + 48);
  ctx.font = "700 36px Arial";
  ctx.textAlign = "right";
  ctx.fillText(money(total), WIDTH - 84, y + 78);
  ctx.textAlign = "left";

  y += 170;
  ctx.fillStyle = INK;
  ctx.font = "400 26px Arial";
  const note = order.note.trim() || "Sin observaciones";
  ctx.fillText(note.length > 70 ? `${note.slice(0, 67)}...` : note, 56, y);
  ctx.font = "400 24px Arial";
  ctx.fillText("Precios y stock sujetos a confirmación.", 56, y + 48);
  return canvas;
}

/** Botón Guardar PDF: baja una imagen del pedido para la galería del teléfono. */
export async function saveOrderImage(order: Order) {
  const canvas = drawOrderImage(order);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) return;

  const file = new File([blob], `pedido-${orderCode(order)}.jpg`, { type: "image/jpeg" });
  const mobile = window.matchMedia("(pointer: coarse)").matches;
  if (mobile && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Pedido ${orderCode(order)}` });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
