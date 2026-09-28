import type { Order } from "@/lib/types";
import { formatDateTime, formatMoney, orderPayable, orderTotal } from "@/lib/format";

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

function orderCode(order: Order): string {
  const date = new Date(order.createdAt);
  const stamp = Number.isNaN(date.getTime())
    ? "00000000"
    : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const tail = order.id.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "0000";
  return `NP-${stamp}-${tail}`;
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
  ) {
    const shown = pdfText(value);
    const left = align === "right" ? x + width - textWidth(value, size) : x;
    this.ops.push(
      "BT",
      `/${font} ${n(size)} Tf`,
      `${n(left)} ${n(y)} Td`,
      `(${shown}) Tj`,
      "ET",
    );
  }

  toString() {
    return this.ops.join("\n");
  }
}

function drawHeader(page: Sheet, order: Order) {
  page.fill("#e92026");
  page.rect(0, 758, 595, 84);
  page.fill("#ffffff");
  page.text("F1", 9, 36, 812, "LIBRERÍA MAYORISTA SOFÍA");
  page.text("F2", 18, 36, 786, "NOTA DE PEDIDO");
  page.text("F1", 8, 36, 768, "Córdoba  ·  WhatsApp 351 676-8638");
  page.text("F2", 10, 340, 812, orderCode(order), "right", 220);
  page.text("F1", 9, 340, 796, formatDateTime(order.createdAt), "right", 220);
  const badge = order.delivery === "envio" ? "CON ENVÍO" : "RETIRO EN LOCAL";
  page.text("F2", 9, 340, 778, badge, "right", 220);
}

function infoCard(page: Sheet, x: number, y: number, w: number, title: string, lines: string[]) {
  page.fill("#f7f4ef");
  page.rect(x, y, w, 112);
  page.stroke("#e6dfd6");
  page.box(x, y, w, 112);
  page.fill("#e92026");
  page.text("F2", 8, x + 12, y + 94, title);
  page.fill("#1b1d21");
  lines.slice(0, 4).forEach((line, index) => {
    page.text("F1", 10, x + 12, y + 74 - index * 16, clip(line, 42));
  });
}

export function buildOrderPdf(order: Order): Uint8Array {
  const subtotal = orderTotal(order);
  const payable = orderPayable(order);
  const shipping =
    order.delivery === "envio"
      ? order.shippingCost == null
        ? "A coordinar"
        : money(order.shippingCost)
      : money(0);
  const pages: Sheet[] = [];
  let page = new Sheet();
  pages.push(page);
  drawHeader(page, order);

  const clientLines = [
    order.customerName || "Cliente",
    order.businessName || "Sin comercio",
    order.phone ? `Tel. ${order.phone}` : "Sin telefono",
    order.note ? clip(order.note, 42) : "Sin nota",
  ];
  const addressLines = wrap(order.address || "Sin dirección", 38).slice(0, 2);
  const shippingLines =
    order.delivery === "envio"
      ? ["Envío a domicilio", ...addressLines, `Costo: ${shipping}`]
      : ["Retiro en el local", "Sin costo de envío", "Lo retira el cliente"];
  infoCard(page, 32, 628, 258, "CLIENTE", clientLines);
  infoCard(page, 306, 628, 257, "ENVÍO", shippingLines);

  const columns = [
    { label: "Código", x: 40, w: 78 },
    { label: "Producto", x: 118, w: 214 },
    { label: "Cant.", x: 332, w: 42 },
    { label: "P. unit.", x: 374, w: 78 },
    { label: "Importe", x: 452, w: 96 },
  ];
  let y = 590;

  const header = () => {
    page.fill("#1b1d21");
    page.rect(32, y - 6, 531, 22);
    page.fill("#ffffff");
    for (const column of columns) {
      page.text("F2", 8, column.x, y, column.label);
    }
    y -= 28;
  };
  header();

  order.items.forEach((item, index) => {
    if (y < 120) {
      page = new Sheet();
      pages.push(page);
      drawHeader(page, order);
      y = 720;
      header();
    }
    if (index % 2 === 0) {
      page.fill("#fbf8f5");
      page.rect(32, y - 16, 531, 34);
    }
    const line = item.unitPrice == null ? null : item.unitPrice * item.quantity;
    page.fill("#1b1d21");
    page.text("F1", 8, columns[0].x, y, clip(item.code || "-", 12));
    page.text("F2", 9, columns[1].x, y + 2, clip(item.name, 38));
    page.fill("#6f675f");
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
    y -= 36;
  });

  y -= 8;
  if (y < 120) {
    page = new Sheet();
    pages.push(page);
    drawHeader(page, order);
    y = 720;
  }
  page.fill("#f7f4ef");
  page.rect(330, y - 62, 233, 78);
  page.stroke("#e6dfd6");
  page.box(330, y - 62, 233, 78);
  page.fill("#6f675f");
  page.text("F1", 9, 344, y, "Subtotal");
  page.text("F1", 9, 344, y - 16, "Envío");
  page.fill("#1b1d21");
  page.text("F1", 9, 430, y, subtotal == null ? "A confirmar" : money(subtotal), "right", 118);
  page.text("F1", 9, 430, y - 16, shipping, "right", 118);
  page.fill("#e92026");
  page.rect(330, y - 62, 233, 26);
  page.fill("#ffffff");
  page.text("F2", 10, 344, y - 48, "TOTAL");
  page.text("F2", 10, 430, y - 48, payable == null ? "A confirmar" : money(payable), "right", 118);

  page.fill("#8a8178");
  page.text(
    "F1",
    8,
    32,
    36,
    "Nota de pedido. Enviar este PDF, sin otro mensaje, al WhatsApp 351 676-8638.",
  );

  return assemble(pages.map((sheet) => sheet.toString()));
}

function assemble(streams: string[]): Uint8Array {
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const pageIds: number[] = [];
  let nextId = 5;
  for (const stream of streams) {
    const contentId = nextId++;
    const pageId = nextId++;
    pageIds.push(pageId);
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`;
  }
  objects[2] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
