"use client";

import { formatDateTime, formatMoney, lineTotal, orderTotal } from "@/lib/format";
import { orderCode } from "@/lib/order-code";
import { quantityLabel } from "@/lib/selling-unit";
import type { Order } from "@/lib/types";

const WIDTH = 1080;
const PAD = 84;
const CREAM = "#f6f1ea";
const BLUE = "#014d9b";
const INK = "#1b1d21";

function money(value: number | null): string {
  return value == null ? "A confirmar" : formatMoney(value);
}

function loadLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "/logo-mark.png";
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else current = next;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const joined = lines.join(" ");
  const full = words.join(" ");
  if (lines.length === maxLines && full.length > joined.length) {
    let last = lines[maxLines - 1] ?? "";
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  }
}

function hairline(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  const gradient = ctx.createLinearGradient(x1, y, x2, y);
  gradient.addColorStop(0, "rgba(1,77,155,0)");
  gradient.addColorStop(0.16, "rgba(1,77,155,0.28)");
  gradient.addColorStop(0.5, BLUE);
  gradient.addColorStop(0.84, "rgba(1,77,155,0.28)");
  gradient.addColorStop(1, "rgba(1,77,155,0)");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

type Draw = (ctx: CanvasRenderingContext2D) => void;

/** Carta del pedido: crema, logo sin fondo y filete fino. */
function drawOrderImage(order: Order, logo: HTMLImageElement | null): HTMLCanvasElement {
  const probe = document.createElement("canvas").getContext("2d");
  const canvas = document.createElement("canvas");
  if (!probe) return canvas;

  const ops: Draw[] = [];
  let y = 64;

  if (logo) {
    const logoHeight = 196;
    const logoWidth = logoHeight * (logo.naturalWidth / logo.naturalHeight);
    const left = (WIDTH - logoWidth) / 2;
    const top = y;
    ops.push((ctx) => ctx.drawImage(logo, left, top, logoWidth, logoHeight));
    y += logoHeight + 22;
  }

  const ruleY = y;
  ops.push((ctx) => hairline(ctx, WIDTH / 2 - 210, WIDTH / 2 + 210, ruleY));
  y += 46;

  const titleY = y;
  ops.push((ctx) => {
    ctx.fillStyle = BLUE;
    ctx.font = "600 22px Arial";
    ctx.textAlign = "left";
    const label = "PEDIDO";
    const tracking = 9;
    const width =
      [...label].reduce((sum, char) => sum + ctx.measureText(char).width, 0) + tracking * (label.length - 1);
    spaced(ctx, label, (WIDTH - width) / 2, titleY, tracking);
  });
  y += 34;

  const delivery = order.delivery === "envio" ? "Envío" : "Retiro en local";
  const meta = `${orderCode(order)}    ·    ${formatDateTime(order.createdAt)}    ·    ${delivery}`;
  const metaY = y;
  ops.push((ctx) => {
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = INK;
    ctx.font = "400 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(meta, WIDTH / 2, metaY);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  });
  y += 52;

  const fields: Array<[string, string]> = [
    ["Cliente", order.customerName || "—"],
    ["Comercio", order.businessName || "—"],
    ["CUIT", order.cuit || "—"],
    ["Teléfono", order.phone || "—"],
    ["Dirección", order.address || "—"],
  ];
  for (const [label, value] of fields) {
    probe.font = "400 28px Arial";
    const lines = wrapLines(probe, value, WIDTH - PAD * 2, 2);
    const labelY = y;
    const valueLines = lines;
    ops.push((ctx) => {
      ctx.fillStyle = BLUE;
      ctx.font = "600 15px Arial";
      spaced(ctx, label.toUpperCase(), PAD, labelY, 2.4);
      ctx.fillStyle = INK;
      ctx.font = "400 28px Arial";
      valueLines.forEach((line, index) => ctx.fillText(line, PAD, labelY + 32 + index * 34));
    });
    y += 36 + lines.length * 34 + 8;
  }

  y += 8;
  const detailRule = y;
  ops.push((ctx) => hairline(ctx, PAD, WIDTH - PAD, detailRule));
  y += 36;
  const detailY = y;
  ops.push((ctx) => {
    ctx.fillStyle = BLUE;
    ctx.font = "600 15px Arial";
    spaced(ctx, "DETALLE", PAD, detailY, 2.4);
  });
  y += 28;

  order.items.forEach((item, index) => {
    probe.font = "400 26px Arial";
    const nameLines = wrapLines(probe, item.name, WIDTH - PAD * 2 - 48, 2);
    const top = y;
    const subtotal = lineTotal(item.unitPrice, item.quantity);
    const qty = quantityLabel(item.presentation, item.quantity);
    ops.push((ctx) => {
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(PAD, top, 20, 20);
      ctx.fillStyle = BLUE;
      ctx.font = "600 18px Arial";
      ctx.fillText(`${index + 1}   ${item.code || "Sin código"}`, PAD + 36, top + 16);
      ctx.fillStyle = INK;
      ctx.font = "400 26px Arial";
      nameLines.forEach((line, lineIndex) => ctx.fillText(line, PAD + 36, top + 50 + lineIndex * 32));
      const foot = top + 50 + nameLines.length * 32;
      ctx.globalAlpha = 0.72;
      ctx.font = "400 20px Arial";
      ctx.fillText(`${qty}   ·   ${money(item.unitPrice)}`, PAD + 36, foot);
      ctx.globalAlpha = 1;
      ctx.font = "600 24px Arial";
      ctx.textAlign = "right";
      ctx.fillText(money(subtotal), WIDTH - PAD, foot);
      ctx.textAlign = "left";
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD, foot + 18);
      ctx.lineTo(WIDTH - PAD, foot + 18);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    y += 78 + nameLines.length * 32;
  });

  y += 16;
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = orderTotal(order);
  const totalRule = y;
  const unitsY = y + 36;
  const totalY = y + 78;
  ops.push((ctx) => {
    hairline(ctx, PAD, WIDTH - PAD, totalRule);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = INK;
    ctx.font = "400 22px Arial";
    ctx.fillText("Unidades", PAD, unitsY);
    ctx.textAlign = "right";
    ctx.fillText(String(units), WIDTH - PAD, unitsY);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
    ctx.fillStyle = BLUE;
    ctx.font = "600 18px Arial";
    spaced(ctx, "TOTAL", PAD, totalY, 3);
    ctx.font = "600 34px Arial";
    ctx.textAlign = "right";
    ctx.fillText(money(total), WIDTH - PAD, totalY + 4);
    ctx.textAlign = "left";
  });
  y += 118;

  const note = order.note.trim() || "Sin observaciones";
  probe.font = "400 22px Arial";
  const noteLines = wrapLines(probe, note, WIDTH - PAD * 2, 3);
  const noteTop = y;
  ops.push((ctx) => {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = INK;
    ctx.font = "400 22px Arial";
    noteLines.forEach((line, index) => ctx.fillText(line, PAD, noteTop + index * 30));
    ctx.globalAlpha = 0.65;
    ctx.font = "400 20px Arial";
    ctx.fillText("Precios y stock sujetos a confirmación.", PAD, noteTop + noteLines.length * 30 + 16);
    ctx.globalAlpha = 1;
  });
  y += noteLines.length * 30 + 64;

  const height = y;
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.strokeStyle = BLUE;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1;
  ctx.strokeRect(32, 32, WIDTH - 64, height - 64);
  ctx.globalAlpha = 1;
  for (const op of ops) op(ctx);
  return canvas;
}

/** Botón Guardar PDF: baja una imagen del pedido para la galería del teléfono. */
export async function saveOrderImage(order: Order) {
  const logo = await loadLogo();
  const canvas = drawOrderImage(order, logo);
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
