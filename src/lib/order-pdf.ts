import type { Order } from "@/lib/types";
import { formatDateTime, formatMoney, formatShipDate, orderTotal } from "@/lib/format";
import { logoMarkPdf } from "@/lib/logo-pdf-data";
import { orderCode } from "@/lib/order-code";

const WIN_ANSI: Record<string, string> = {
  "á": "\\341",
  "é": "\\351",
  "í": "\\355",
  "ó": "\\363",
  "ú": "\\372",
  "Á": "\\301",
  "É": "\\311",
  "Í": "\\315",
  "Ó": "\\323",
  "Ú": "\\332",
  "ñ": "\\361",
  "Ñ": "\\321",
  "ü": "\\374",
  "Ü": "\\334",
  "¿": "\\277",
  "¡": "\\241",
  "°": "\\260",
  "·": "\\267",
  "\u00a0": " ",
  "\u202f": " ",
};

function pdfText(value: string): string {
  let out = "";
  for (const char of value) {
    if (char === "\\" || char === "(" || char === ")") out += `\\${char}`;
    else if (WIN_ANSI[char]) out += WIN_ANSI[char];
    else if (char.charCodeAt(0) < 128 && char !== "\n" && char !== "\r") out += char;
    else out += " ";
  }
  return out;
}

function n(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

function money(value: number): string {
  return formatMoney(value).replace(/\u00a0|\u202f/g, " ");
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 3))}...`;
}

function wrap(value: string, max: number): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textWidth(value: string, size: number): number {
  let units = 0;
  for (const char of value) {
    if (char === " ") units += 280;
    else if (".,:il".includes(char)) units += 280;
    else if (char === "$" || (char >= "0" && char <= "9")) units += 560;
    else if (char === char.toUpperCase() && char !== char.toLowerCase()) units += 700;
    else units += 520;
  }
  return (units / 1000) * size;
}

class Sheet {
  private ops: string[] = [];

  fill(hex: string) {
    const color = Number.parseInt(hex.slice(1), 16);
    this.ops.push(
      `${n(((color >> 16) & 255) / 255)} ${n(((color >> 8) & 255) / 255)} ${n((color & 255) / 255)} rg`,
    );
  }

  stroke(hex: string) {
    const color = Number.parseInt(hex.slice(1), 16);
    this.ops.push(
      `${n(((color >> 16) & 255) / 255)} ${n(((color >> 8) & 255) / 255)} ${n((color & 255) / 255)} RG`,
    );
  }

  rect(x: number, y: number, w: number, h: number) {
    this.ops.push(`${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`);
  }

  box(x: number, y: number, w: number, h: number) {
    this.ops.push("0.8 w", `${n(x)} ${n(y)} ${n(w)} ${n(h)} re S`);
  }

  text(
    font: "F1" | "F2",
    size: number,
    x: number,
    y: number,
    value: string,
    align: "left" | "right" = "left",
    width = 0,
    tracking = 0,
  ) {
    const shown = pdfText(value);
    const extra = tracking * Math.max(0, [...value].length - 1);
    const left = align === "right" ? x + width - textWidth(value, size) - extra : x;
    this.ops.push(
      "BT",
      `/${font} ${n(size)} Tf`,
      `${n(tracking)} Tc`,
      `${n(left)} ${n(y)} Td`,
      `(${shown}) Tj`,
      "0 Tc",
      "ET",
    );
  }

  rule(x1: number, x2: number, y: number) {
    this.ops.push("0.45 w", `${n(x1)} ${n(y)} m ${n(x2)} ${n(y)} l S`);
  }

  raw(value: string) {
    this.ops.push(value);
  }

  toString() {
    return this.ops.join("\n");
  }
}

function decode64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

const logoRgb = decode64(logoMarkPdf.rgb);
const logoAlpha = decode64(logoMarkPdf.alpha);

/** Cabecera en crema: el logo entra sin placa de color detrás. */
function drawHeader(page: Sheet, order: Order): number {
  page.fill("#f6f1ea");
  page.rect(0, 0, 595, 842);
  const logoW = 78;
  const logoH = (logoW * logoMarkPdf.height) / logoMarkPdf.width;
  const x = (595 - logoW) / 2;
  const y = 842 - 28 - logoH;
  page.raw(`q\n${n(logoW)} 0 0 ${n(logoH)} ${n(x)} ${n(y)} cm\n/Im1 Do\nQ`);
  const lineY = y - 12;
  page.stroke("#014d9b");
  page.rule(214, 381, lineY);
  page.fill("#014d9b");
  const title = "PEDIDO";
  const titleSize = 10;
  const tracking = 1.8;
  const titleW = textWidth(title, titleSize) + tracking * (title.length - 1);
  page.text("F2", titleSize, (595 - titleW) / 2, lineY - 16, title, "left", 0, tracking);
  const delivery = order.delivery === "envio" ? "Envío" : "Retiro en local";
  const meta = `${orderCode(order)}  ·  ${formatDateTime(order.createdAt)}  ·  ${delivery}`;
  page.fill("#1b1d21");
  const metaW = textWidth(meta, 8);
  page.text("F1", 8, (595 - metaW) / 2, lineY - 30, clip(meta, 92));
  return lineY - 48;
}

function infoBlock(page: Sheet, x: number, top: number, title: string, lines: string[]) {
  page.fill("#014d9b");
  page.text("F2", 8, x, top, title, "left", 0, 0.8);
  page.stroke("#014d9b");
  page.rule(x, x + 230, top - 6);
  page.fill("#1b1d21");
  lines.slice(0, 4).forEach((line, index) => {
    page.text("F1", 10, x, top - 24 - index * 14, clip(line, 40));
  });
}

export function buildOrderPdf(order: Order): Uint8Array {
  const subtotal = orderTotal(order);
  const payable =
    subtotal == null
      ? null
      : subtotal + (order.delivery === "envio" && order.shippingCost != null ? order.shippingCost : 0);
  const shipping =
    order.delivery === "envio"
      ? order.shippingCost == null
        ? "A coordinar"
        : money(order.shippingCost)
      : money(0);
  const pages: Sheet[] = [];
  let page = new Sheet();
  pages.push(page);
  const contentTop = drawHeader(page, order);

  const clientLines = [
    order.customerName || "Cliente",
    order.businessName || "Sin comercio",
    order.cuit ? `CUIT ${order.cuit}` : "Sin CUIT",
    order.phone ? `Tel. ${order.phone}` : "Sin telefono",
  ];
  const addressLines = wrap(order.address || "Sin dirección", 38).slice(0, 1);
  const estimate = order.estimatedShipDate
    ? `Estimada: ${formatShipDate(order.estimatedShipDate)}`
    : "Fecha estimada: a coordinar";
  const shippingLines =
    order.delivery === "envio"
      ? ["Envío a domicilio", ...addressLines, `Costo: ${shipping}`, estimate]
      : ["Retiro en el local", "Sin costo de envío", estimate];
  infoBlock(page, 36, contentTop, "CLIENTE", clientLines);
  infoBlock(page, 318, contentTop, "ENTREGA", shippingLines);

  const columns = [
    { label: "Código", x: 54, w: 72 },
    { label: "Producto", x: 128, w: 196 },
    { label: "Cant.", x: 326, w: 48 },
    { label: "P. unit.", x: 376, w: 76 },
    { label: "Importe", x: 454, w: 94 },
  ];
  let y = contentTop - 96;

  const header = () => {
    page.stroke("#014d9b");
    page.rule(36, 559, y + 14);
    page.fill("#014d9b");
    for (const column of columns) {
      page.text("F2", 8, column.x, y, column.label, "left", 0, 0.4);
    }
    page.stroke("#014d9b");
    page.rule(36, 559, y - 6);
    y -= 24;
  };
  header();

  order.items.forEach((item) => {
    if (y < 120) {
      page = new Sheet();
      pages.push(page);
      y = drawHeader(page, order) - 8;
      header();
    }
    const line = item.unitPrice == null ? null : item.unitPrice * item.quantity;
    page.stroke("#014d9b");
    page.box(36, y - 3, 10, 10);
    page.fill("#1b1d21");
    page.text("F1", 8, columns[0].x, y, clip(item.code || "-", 12));
    page.text("F2", 9, columns[1].x, y + 2, clip(item.name, 38));
    page.fill("#014d9b");
    page.text(
      "F1",
      8,
      columns[1].x,
      y - 11,
      clip([item.presentation].filter(Boolean).join(" · ") || " ", 40),
    );
    page.fill("#1b1d21");
    page.text("F1", 9, columns[2].x, y, String(item.quantity), "right", columns[2].w);
    page.text(
      "F1",
      9,
      columns[3].x,
      y,
      item.unitPrice == null ? "A confirmar" : money(item.unitPrice),
      "right",
      columns[3].w,
    );
    page.text("F2", 9, columns[4].x, y, line == null ? "A confirmar" : money(line), "right", columns[4].w);
    page.stroke("#014d9b");
    page.rule(36, 559, y - 16);
    y -= 32;
  });

  y -= 8;
  if (y < 120) {
    page = new Sheet();
    pages.push(page);
    y = drawHeader(page, order) - 8;
  }
  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
  page.stroke("#014d9b");
  page.rule(330, 559, y + 10);
  page.fill("#1b1d21");
  page.text("F1", 9, 344, y - 8, "Unidades");
  page.text("F1", 9, 344, y - 24, "Subtotal");
  page.text("F1", 9, 344, y - 40, "Envío");
  page.text("F1", 9, 430, y - 8, String(units), "right", 118);
  page.text("F1", 9, 430, y - 24, subtotal == null ? "A confirmar" : money(subtotal), "right", 118);
  page.text("F1", 9, 430, y - 40, shipping, "right", 118);
  page.stroke("#014d9b");
  page.rule(330, 559, y - 50);
  page.fill("#014d9b");
  page.text("F2", 11, 344, y - 68, "TOTAL", "left", 0, 1.1);
  page.text("F2", 11, 430, y - 68, payable == null ? "A confirmar" : money(payable), "right", 118);

  page.fill("#1b1d21");
  const note = order.note.trim() ? `Obs.: ${order.note.trim()}` : "Sin observaciones";
  page.text("F1", 9, 32, 56, clip(note, 88));
  page.text("F1", 8, 32, 36, "Precios y stock sujetos a confirmación.");

  return assemble(pages.map((sheet) => sheet.toString()));
}

function assemble(streams: string[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  const encoder = new TextEncoder();
  let length = 0;
  const offsets: number[] = [];

  function add(part: string | Uint8Array) {
    const bytes = typeof part === "string" ? encoder.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  }

  function addObject(id: number, body: Array<string | Uint8Array>) {
    offsets[id] = length;
    add(`${id} 0 obj\n`);
    for (const part of body) add(part);
    add("\nendobj\n");
  }

  add("%PDF-1.4\n");
  add(new Uint8Array([0x25, 0xff, 0xff, 0xff, 0xff, 0x0a]));

  const firstContent = 7;
  const pageIds = streams.map((_, index) => firstContent + index * 2 + 1);
  addObject(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  addObject(2, [
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
  ]);
  addObject(3, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"]);
  addObject(4, ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"]);
  addObject(5, [
    `<< /Type /XObject /Subtype /Image /Width ${logoMarkPdf.width} /Height ${logoMarkPdf.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logoRgb.length} /SMask 6 0 R >>\nstream\n`,
    logoRgb,
    "\nendstream",
  ]);
  addObject(6, [
    `<< /Type /XObject /Subtype /Image /Width ${logoMarkPdf.width} /Height ${logoMarkPdf.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${logoAlpha.length} >>\nstream\n`,
    logoAlpha,
    "\nendstream",
  ]);

  streams.forEach((stream, index) => {
    const contentId = firstContent + index * 2;
    const pageId = contentId + 1;
    const bytes = encoder.encode(stream);
    addObject(contentId, [`<< /Length ${bytes.length} >>\nstream\n`, bytes, "\nendstream"]);
    addObject(pageId, [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 5 0 R >> >> >>`,
    ]);
  });

  const xref = length;
  let trailer = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < offsets.length; id += 1) {
    trailer += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  trailer += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  add(trailer);

  const out = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}
