import type { Order } from "@/lib/types";
import { formatDateTime, formatOrderText } from "@/lib/format";

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
  "\u00a0": " ",
  "\u202f": " ",
};

function pdfText(value: string): string {
  let out = "";
  for (const char of value) {
    if (char === "\\" || char === "(" || char === ")") {
      out += `\\${char}`;
    } else if (WIN_ANSI[char]) {
      out += WIN_ANSI[char];
    } else if (char.charCodeAt(0) < 128 && char !== "\n" && char !== "\r") {
      out += char;
    } else if (char === "\n" || char === "\r") {
      out += " ";
    } else {
      out += "?";
    }
  }
  return out;
}

function wrap(value: string, width = 86): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function orderPdfLines(order: Order): string[] {
  const lines = [
    "LIBRERIA MAYORISTA SOFIA",
    "Pedido",
    formatDateTime(order.createdAt),
    "",
    ...formatOrderText(order).split("\n"),
  ];
  return lines.flatMap((line) => wrap(line));
}

export function buildOrderPdf(order: Order): Uint8Array {
  const pages: string[][] = [];
  let page: string[] = [];
  for (const line of orderPdfLines(order)) {
    page.push(line);
    if (page.length >= 42) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length || pages.length === 0) pages.push(page);

  const objects: string[] = [];
  const pageIds: number[] = [];
  let nextId = 3;

  const contentIds: number[] = [];
  for (const lines of pages) {
    const contentId = nextId++;
    const pageId = nextId++;
    contentIds.push(contentId);
    pageIds.push(pageId);
    const commands = ["BT", "/F1 11 Tf", "14 TL", "48 800 Td"];
    lines.forEach((line, index) => {
      if (index > 0) commands.push("T*");
      commands.push(`(${pdfText(line)}) Tj`);
    });
    commands.push("ET");
    const stream = commands.join("\n");
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 5 0 R >> >> >>`;
  }

  const fontId = nextId;
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  objects[fontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let id = 1; id <= fontId; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${fontId + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id <= fontId; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${fontId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
