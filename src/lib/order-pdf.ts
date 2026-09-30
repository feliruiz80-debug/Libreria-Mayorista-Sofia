import type { Order } from "@/lib/types";
import { COMPANY } from "@/lib/company";
import { orderTotal } from "@/lib/format";
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

function money(value: number | null): string {
  if (value == null) return "A confirmar";
  return moneyAr.format(value);
}

function qty(value: number): string {
  return qtyAr.format(value);
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 3))}...`;
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

/** Número tipo presupuesto a partir del código del pedido. */
function presupuestoNumber(order: Pick<Order, "id" | "createdAt">): string {
  const code = orderCode(order).replace(/\D/g, "");
  const tail = code.slice(-8).padStart(8, "0");
  return `0001-${tail}`;
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

  box(x: number, y: number, w: number, h: number, width = 0.7) {
    this.ops.push(`${n(width)} w`, `${n(x)} ${n(y)} ${n(w)} ${n(h)} re S`);
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.6) {
    this.ops.push(`${n(width)} w`, `${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
  }

  text(
    font: "F1" | "F2",
    size: number,
    x: number,
    y: number,
    value: string,
    align: "left" | "right" | "center" = "left",
    width = 0,
  ) {
    const shown = pdfText(value);
    let left = x;
    if (align === "right") left = x + width - textWidth(value, size);
    if (align === "center") left = x + (width - textWidth(value, size)) / 2;
    this.ops.push("BT", `/${font} ${n(size)} Tf`, `${n(left)} ${n(y)} Td`, `(${shown}) Tj`, "ET");
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

const LEFT = 36;
const RIGHT = 559;
const WIDTH = RIGHT - LEFT;

function drawHeader(page: Sheet, order: Order): number {
  page.fill("#ffffff");
  page.rect(0, 0, 595, 842);

  const logoW = 42;
  const logoH = (logoW * logoMarkPdf.height) / logoMarkPdf.width;
  const logoX = LEFT;
  const logoY = 842 - 28 - logoH;
  page.raw(`q\n${n(logoW)} 0 0 ${n(logoH)} ${n(logoX)} ${n(logoY)} cm\n/Im1 Do\nQ`);

  page.fill(COMPANY.blue);
  page.text("F2", 12, LEFT + logoW + 8, 842 - 36, COMPANY.name);
  page.fill(COMPANY.ink);
  page.text("F1", 8, LEFT + logoW + 8, 842 - 50, `CUIT: ${COMPANY.cuit}`);
  page.text("F1", 8, LEFT + logoW + 8, 842 - 61, `Dirección: ${COMPANY.address}`);
  page.text("F1", 8, LEFT + logoW + 8, 842 - 72, `Teléfonos: ${COMPANY.phones}`);
  page.text("F1", 8, LEFT + logoW + 8, 842 - 83, `Mail: ${COMPANY.email}`);

  const boxSize = 28;
  const boxX = 286;
  const boxY = 842 - 34 - boxSize;
  page.stroke(COMPANY.ink);
  page.box(boxX, boxY, boxSize, boxSize, 1);
  page.fill(COMPANY.ink);
  page.text("F2", 18, boxX, boxY + 7, "X", "center", boxSize);
  page.text("F1", 6.5, 248, boxY - 12, "Comprobante No Valido como Factura", "center", 104);

  page.fill(COMPANY.ink);
  page.text("F2", 10, RIGHT - 130, 842 - 36, presupuestoNumber(order), "right", 130);
  page.fill(COMPANY.blue);
  page.text("F2", 14, RIGHT - 130, 842 - 56, "PRESUPUESTO", "right", 130);

  page.stroke(COMPANY.ink);
  page.line(LEFT, 842 - 100, RIGHT, 842 - 100, 0.8);
  return 842 - 108;
}

function drawClientBox(page: Sheet, order: Order, top: number): number {
  const height = 58;
  const bottom = top - height;
  page.stroke(COMPANY.ink);
  page.box(LEFT, bottom, WIDTH, height, 0.7);
  page.line(LEFT + WIDTH * 0.58, bottom, LEFT + WIDTH * 0.58, top, 0.5);

  const leftX = LEFT + 8;
  const rightX = LEFT + WIDTH * 0.58 + 8;
  const cliente = order.businessName || order.customerName || "—";
  const domicilio = [order.address, order.customerName && order.businessName ? order.customerName : ""]
    .filter(Boolean)
    .join(" · ");

  page.fill(COMPANY.ink);
  page.text("F2", 8, leftX, top - 14, "Cliente:");
  page.text("F1", 8, leftX + 42, top - 14, clip(cliente, 38));
  page.text("F2", 8, leftX, top - 28, "Domicilio:");
  page.text("F1", 8, leftX + 50, top - 28, clip(domicilio || "—", 36));
  page.text("F2", 8, leftX, top - 42, "I.V.A.:");
  page.text("F1", 8, leftX + 34, top - 42, "—");
  if (order.cuit) {
    page.text("F2", 8, leftX, top - 54, "CUIT:");
    page.text("F1", 8, leftX + 32, top - 54, order.cuit);
  }

  page.text("F2", 8, rightX, top - 14, "Fecha Presupuesto:");
  page.text("F1", 8, rightX + 96, top - 14, formatDate(order.createdAt));
  page.text("F2", 8, rightX, top - 28, "Fecha de Vigencia:");
  page.text("F1", 8, rightX + 92, top - 28, validityDate(order.createdAt));
  page.text("F2", 8, rightX, top - 42, "Entrega:");
  page.text("F1", 8, rightX + 42, top - 42, order.delivery === "envio" ? "Envío" : "Retiro");
  page.text("F2", 8, rightX, top - 54, "Tel.:");
  page.text("F1", 8, rightX + 24, top - 54, clip(order.phone || "—", 22));

  return bottom - 14;
}

function drawTableHeader(page: Sheet, y: number): number {
  const columns = [
    { label: "Articulo", x: LEFT + 4, w: 72, align: "left" as const },
    { label: "Cantidad", x: LEFT + 78, w: 54, align: "right" as const },
    { label: "Descripción", x: LEFT + 140, w: 220, align: "left" as const },
    { label: "P. U.", x: LEFT + 368, w: 70, align: "right" as const },
    { label: "Total", x: LEFT + 444, w: 72, align: "right" as const },
  ];
  page.stroke(COMPANY.ink);
  page.line(LEFT, y + 12, RIGHT, y + 12, 0.7);
  page.fill(COMPANY.ink);
  for (const column of columns) {
    page.text("F2", 8, column.x, y, column.label, column.align, column.w);
  }
  page.line(LEFT, y - 6, RIGHT, y - 6, 0.7);
  return y - 20;
}

function drawFooter(page: Sheet) {
  const y = 42;
  page.stroke(COMPANY.ink);
  page.line(LEFT, y + 28, RIGHT, y + 28, 0.5);
  page.fill(COMPANY.blue);
  page.text("F1", 7.5, LEFT, y + 12, `Visítanos en redes: ${COMPANY.instagram}`);
  page.text("F1", 7.5, LEFT + 175, y + 12, `Contáctanos ${COMPANY.contactPhone}`, "center", 170);
  page.text("F1", 7.5, RIGHT - 170, y + 12, `visita nuestra web ${COMPANY.web}`, "right", 170);
  page.fill(COMPANY.ink);
  page.text("F1", 7, LEFT, y - 2, "Precios y stock sujetos a confirmación.");
}

export function buildOrderPdf(order: Order): Uint8Array {
  const subtotal = orderTotal(order);
  const pages: Sheet[] = [];
  let page = new Sheet();
  pages.push(page);

  let y = drawHeader(page, order);
  y = drawClientBox(page, order, y);
  y = drawTableHeader(page, y);

  const col = {
    code: LEFT + 4,
    qty: LEFT + 78,
    name: LEFT + 140,
    unit: LEFT + 368,
    total: LEFT + 444,
  };

  order.items.forEach((item) => {
    if (y < 160) {
      drawFooter(page);
      page = new Sheet();
      pages.push(page);
      y = drawHeader(page, order);
      y = drawTableHeader(page, y - 8);
    }
    const line = item.unitPrice == null ? null : item.unitPrice * item.quantity;
    const description = [item.name, item.presentation].filter(Boolean).join(" · ");
    page.fill(COMPANY.ink);
    page.text("F1", 8, col.code, y, clip(item.code || "—", 12));
    page.text("F1", 8, col.qty, y, qty(item.quantity), "right", 54);
    page.text("F1", 8, col.name, y, clip(description, 42));
    page.text("F1", 8, col.unit, y, item.unitPrice == null ? "—" : money(item.unitPrice), "right", 70);
    page.text("F1", 8, col.total, y, line == null ? "—" : money(line), "right", 72);
    y -= 14;
  });

  y -= 8;
  if (y < 180) {
    drawFooter(page);
    page = new Sheet();
    pages.push(page);
    y = drawHeader(page, order) - 20;
  }

  page.stroke(COMPANY.ink);
  page.line(LEFT, y + 10, RIGHT, y + 10, 0.7);

  const totalsX = LEFT + 330;
  page.fill(COMPANY.ink);
  page.text("F2", 8, LEFT + 4, y - 6, "Observaciones");
  const note = order.note.trim() || "—";
  page.text("F1", 8, LEFT + 4, y - 20, clip(note, 48));
  if (order.phone || order.cuit) {
    page.text(
      "F1",
      7.5,
      LEFT + 4,
      y - 34,
      clip([order.customerName, order.cuit && `CUIT ${order.cuit}`, order.phone].filter(Boolean).join(" · "), 52),
    );
  }

  page.text("F1", 8, totalsX, y - 6, "SubTotal");
  page.text("F1", 8, totalsX + 90, y - 6, subtotal == null ? "—" : money(subtotal), "right", 100);
  page.text("F1", 8, totalsX, y - 20, "SubTotal Impuestos");
  page.text("F1", 8, totalsX + 90, y - 20, money(0), "right", 100);
  page.text("F1", 8, totalsX, y - 34, "Desc/Rec");
  page.text("F1", 8, totalsX + 90, y - 34, money(0), "right", 100);
  page.stroke(COMPANY.ink);
  page.line(totalsX, y - 42, RIGHT, y - 42, 0.6);
  page.fill(COMPANY.ink);
  page.text("F2", 9, totalsX, y - 56, "Sub Total $");
  page.text("F2", 9, totalsX + 90, y - 56, subtotal == null ? "—" : money(subtotal), "right", 100);

  y -= 78;
  page.stroke(COMPANY.ink);
  page.line(LEFT, y + 12, RIGHT, y + 12, 0.5);
  for (let index = 1; index <= 5; index += 1) {
    page.fill(COMPANY.ink);
    page.text("F1", 7.5, LEFT + 4, y, `Detalle de la Forma de Pago ${index}`);
    page.text("F1", 7, LEFT + 180, y, "Financiación");
    page.text("F1", 7, LEFT + 320, y, "Imp.");
    page.text("F1", 7, LEFT + 420, y, "Total");
    page.stroke(COMPANY.ink);
    page.line(LEFT, y - 6, RIGHT, y - 6, 0.4);
    y -= 16;
  }

  drawFooter(page);
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
