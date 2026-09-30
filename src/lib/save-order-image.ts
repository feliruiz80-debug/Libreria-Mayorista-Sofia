"use client";

import { COMPANY } from "@/lib/company";
import { orderTotal } from "@/lib/format";
import { orderCode } from "@/lib/order-code";
import type { Order } from "@/lib/types";

const WIDTH = 1240;
const HEIGHT = 1754;
const LEFT = 56;
const RIGHT = WIDTH - 56;
const BLUE = COMPANY.blue;
const INK = COMPANY.ink;

const moneyAr = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qtyAr = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateAr = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

function money(value: number | null): string {
  return value == null ? "—" : moneyAr.format(value);
}

function qty(value: number): string {
  return qtyAr.format(value);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateAr.format(date);
}

function validityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  date.setDate(date.getDate() + 1);
  return dateAr.format(date);
}

function presupuestoNumber(order: Pick<Order, "id" | "createdAt">): string {
  const code = orderCode(order).replace(/\D/g, "");
  const tail = code.slice(-8).padStart(8, "0");
  return `0001-${tail}`;
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/logo-mark.png";
  });
}

function clipText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (ctx.measureText(clean).width <= maxWidth) return clean;
  let out = clean;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
}

/** Presupuesto A4 al estilo de la librería: cabecera, cliente, tabla y totales. */
function drawOrderImage(order: Order, logo: HTMLImageElement | null): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  let y = 48;
  if (logo) {
    const logoH = 88;
    const logoW = logoH * (logo.naturalWidth / logo.naturalHeight);
    ctx.drawImage(logo, LEFT, y, logoW, logoH);
    ctx.fillStyle = BLUE;
    ctx.font = "700 28px Arial";
    ctx.fillText(COMPANY.name, LEFT + logoW + 16, y + 28);
    ctx.fillStyle = INK;
    ctx.font = "400 18px Arial";
    ctx.fillText(`CUIT: ${COMPANY.cuit}`, LEFT + logoW + 16, y + 52);
    ctx.fillText(`Dirección: ${COMPANY.address}`, LEFT + logoW + 16, y + 74);
    ctx.fillText(`Teléfonos: ${COMPANY.phones}`, LEFT + logoW + 16, y + 96);
    ctx.fillText(`Mail: ${COMPANY.email}`, LEFT + logoW + 16, y + 118);
  } else {
    ctx.fillStyle = BLUE;
    ctx.font = "700 28px Arial";
    ctx.fillText(COMPANY.name, LEFT, y + 28);
  }

  const boxSize = 56;
  const boxX = WIDTH / 2 - boxSize / 2;
  const boxY = 52;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxSize, boxSize);
  ctx.fillStyle = INK;
  ctx.font = "700 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("X", boxX + boxSize / 2, boxY + 40);
  ctx.font = "400 13px Arial";
  ctx.fillText("Comprobante No Valido como Factura", WIDTH / 2, boxY + boxSize + 22);
  ctx.textAlign = "left";

  ctx.fillStyle = INK;
  ctx.font = "700 22px Arial";
  ctx.textAlign = "right";
  ctx.fillText(presupuestoNumber(order), RIGHT, 70);
  ctx.fillStyle = BLUE;
  ctx.font = "700 30px Arial";
  ctx.fillText("PRESUPUESTO", RIGHT, 108);
  ctx.textAlign = "left";

  y = 180;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(LEFT, y);
  ctx.lineTo(RIGHT, y);
  ctx.stroke();

  y += 16;
  const boxH = 118;
  const split = LEFT + (RIGHT - LEFT) * 0.58;
  ctx.strokeRect(LEFT, y, RIGHT - LEFT, boxH);
  ctx.beginPath();
  ctx.moveTo(split, y);
  ctx.lineTo(split, y + boxH);
  ctx.stroke();

  const cliente = order.businessName || order.customerName || "—";
  const domicilio = [order.address, order.customerName && order.businessName ? order.customerName : ""]
    .filter(Boolean)
    .join(" · ");
  ctx.fillStyle = INK;
  ctx.font = "700 18px Arial";
  ctx.fillText("Cliente:", LEFT + 14, y + 28);
  ctx.font = "400 18px Arial";
  ctx.fillText(clipText(ctx, cliente, split - LEFT - 110), LEFT + 100, y + 28);
  ctx.font = "700 18px Arial";
  ctx.fillText("Domicilio:", LEFT + 14, y + 54);
  ctx.font = "400 18px Arial";
  ctx.fillText(clipText(ctx, domicilio || "—", split - LEFT - 120), LEFT + 118, y + 54);
  ctx.font = "700 18px Arial";
  ctx.fillText("I.V.A.:", LEFT + 14, y + 80);
  ctx.font = "400 18px Arial";
  ctx.fillText("—", LEFT + 80, y + 80);
  ctx.font = "700 18px Arial";
  ctx.fillText("CUIT:", LEFT + 14, y + 106);
  ctx.font = "400 18px Arial";
  ctx.fillText(order.cuit || "—", LEFT + 80, y + 106);

  ctx.font = "700 18px Arial";
  ctx.fillText("Fecha Presupuesto:", split + 14, y + 28);
  ctx.font = "400 18px Arial";
  ctx.fillText(formatDate(order.createdAt), split + 210, y + 28);
  ctx.font = "700 18px Arial";
  ctx.fillText("Fecha de Vigencia:", split + 14, y + 54);
  ctx.font = "400 18px Arial";
  ctx.fillText(validityDate(order.createdAt), split + 202, y + 54);
  ctx.font = "700 18px Arial";
  ctx.fillText("Entrega:", split + 14, y + 80);
  ctx.font = "400 18px Arial";
  ctx.fillText(order.delivery === "envio" ? "Envío" : "Retiro", split + 100, y + 80);
  ctx.font = "700 18px Arial";
  ctx.fillText("Tel.:", split + 14, y + 106);
  ctx.font = "400 18px Arial";
  ctx.fillText(order.phone || "—", split + 70, y + 106);

  y += boxH + 28;
  const cols = [
    { label: "Articulo", x: LEFT + 8, w: 150, align: "left" as const },
    { label: "Cantidad", x: LEFT + 170, w: 110, align: "right" as const },
    { label: "Descripción", x: LEFT + 300, w: 460, align: "left" as const },
    { label: "P. U.", x: LEFT + 780, w: 140, align: "right" as const },
    { label: "Total", x: LEFT + 940, w: 150, align: "right" as const },
  ];
  ctx.beginPath();
  ctx.moveTo(LEFT, y);
  ctx.lineTo(RIGHT, y);
  ctx.stroke();
  y += 24;
  ctx.font = "700 18px Arial";
  for (const col of cols) {
    if (col.align === "right") {
      ctx.textAlign = "right";
      ctx.fillText(col.label, col.x + col.w, y);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(col.label, col.x, y);
    }
  }
  ctx.textAlign = "left";
  y += 10;
  ctx.beginPath();
  ctx.moveTo(LEFT, y);
  ctx.lineTo(RIGHT, y);
  ctx.stroke();
  y += 28;

  const maxRows = Math.min(order.items.length, 18);
  for (let index = 0; index < maxRows; index += 1) {
    const item = order.items[index];
    const line = item.unitPrice == null ? null : item.unitPrice * item.quantity;
    const description = [item.name, item.presentation].filter(Boolean).join(" · ");
    ctx.fillStyle = INK;
    ctx.font = "400 17px Arial";
    ctx.textAlign = "left";
    ctx.fillText(clipText(ctx, item.code || "—", cols[0].w), cols[0].x, y);
    ctx.textAlign = "right";
    ctx.fillText(qty(item.quantity), cols[1].x + cols[1].w, y);
    ctx.textAlign = "left";
    ctx.fillText(clipText(ctx, description, cols[2].w), cols[2].x, y);
    ctx.textAlign = "right";
    ctx.fillText(money(item.unitPrice), cols[3].x + cols[3].w, y);
    ctx.fillText(money(line), cols[4].x + cols[4].w, y);
    ctx.textAlign = "left";
    y += 28;
  }
  if (order.items.length > maxRows) {
    ctx.fillStyle = INK;
    ctx.font = "400 16px Arial";
    ctx.fillText(`… y ${order.items.length - maxRows} ítems más`, LEFT + 8, y);
    y += 28;
  }

  y += 8;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(LEFT, y);
  ctx.lineTo(RIGHT, y);
  ctx.stroke();
  y += 30;

  const subtotal = orderTotal(order);
  const totalsX = LEFT + 700;
  ctx.font = "700 18px Arial";
  ctx.fillText("Observaciones", LEFT + 8, y);
  ctx.font = "400 17px Arial";
  ctx.fillText(clipText(ctx, order.note.trim() || "—", 520), LEFT + 8, y + 28);

  ctx.font = "400 18px Arial";
  ctx.fillText("SubTotal", totalsX, y);
  ctx.textAlign = "right";
  ctx.fillText(money(subtotal), RIGHT, y);
  ctx.textAlign = "left";
  ctx.fillText("SubTotal Impuestos", totalsX, y + 28);
  ctx.textAlign = "right";
  ctx.fillText(money(0), RIGHT, y + 28);
  ctx.textAlign = "left";
  ctx.fillText("Desc/Rec", totalsX, y + 56);
  ctx.textAlign = "right";
  ctx.fillText(money(0), RIGHT, y + 56);
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.moveTo(totalsX, y + 70);
  ctx.lineTo(RIGHT, y + 70);
  ctx.stroke();
  ctx.font = "700 20px Arial";
  ctx.fillText("Sub Total $", totalsX, y + 96);
  ctx.textAlign = "right";
  ctx.fillText(money(subtotal), RIGHT, y + 96);
  ctx.textAlign = "left";

  y += 130;
  ctx.beginPath();
  ctx.moveTo(LEFT, y);
  ctx.lineTo(RIGHT, y);
  ctx.stroke();
  y += 28;
  for (let index = 1; index <= 5; index += 1) {
    ctx.font = "400 16px Arial";
    ctx.fillStyle = INK;
    ctx.fillText(`Detalle de la Forma de Pago ${index}`, LEFT + 8, y);
    ctx.fillText("Financiación", LEFT + 420, y);
    ctx.fillText("Imp.", LEFT + 760, y);
    ctx.fillText("Total", LEFT + 920, y);
    y += 10;
    ctx.beginPath();
    ctx.moveTo(LEFT, y);
    ctx.lineTo(RIGHT, y);
    ctx.stroke();
    y += 24;
  }

  y = HEIGHT - 70;
  ctx.beginPath();
  ctx.moveTo(LEFT, y - 20);
  ctx.lineTo(RIGHT, y - 20);
  ctx.stroke();
  ctx.fillStyle = BLUE;
  ctx.font = "400 16px Arial";
  ctx.fillText(`Visítanos en redes: ${COMPANY.instagram}`, LEFT, y);
  ctx.textAlign = "center";
  ctx.fillText(`Contáctanos ${COMPANY.contactPhone}`, WIDTH / 2, y);
  ctx.textAlign = "right";
  ctx.fillText(`visita nuestra web ${COMPANY.web}`, RIGHT, y);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = "400 14px Arial";
  ctx.fillText("Precios y stock sujetos a confirmación.", LEFT, y + 26);

  return canvas;
}

/** Botón Guardar PDF: baja una imagen del presupuesto para la galería del teléfono. */
export async function saveOrderImage(order: Order) {
  const logo = await loadLogo();
  const canvas = drawOrderImage(order, logo);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) return;

  const file = new File([blob], `presupuesto-${orderCode(order)}.jpg`, { type: "image/jpeg" });
  const mobile = window.matchMedia("(pointer: coarse)").matches;
  if (mobile && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Presupuesto ${orderCode(order)}` });
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
