import type { Catalog, Product } from "@/lib/types";
import type { SheetTable } from "@/lib/sheets/xlsx";

const STORE_ORIGIN = "https://www.mayoristasofia.com.ar";

function columnIndex(cell: string): number {
  const letters = /^[A-Z]+/.exec(cell)?.[0] ?? "A";
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

function columnLetters(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function rowNumber(cell: string): number {
  return Number(/\d+$/.exec(cell)?.[0] ?? 0);
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function parsePrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    if (/^\d{1,3}(?:\.\d{3})+$/.test(trimmed)) return Number(trimmed.replaceAll(".", ""));
    return Math.round(Number(trimmed));
  }

  let value = trimmed.replace(/\s/g, "").replace(/\$/g, "").replace(/ars/gi, "");
  if (!value) return null;

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    value =
      lastComma > lastDot
        ? value.replace(/\./g, "").replace(",", ".")
        : value.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const fraction = value.slice(lastComma + 1);
    value =
      fraction.length > 0 && fraction.length <= 2 && !/^\d{1,3}(,\d{3})+$/.test(value)
        ? value.replace(/\./g, "").replace(",", ".")
        : value.replace(/,/g, "");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, "");
  }

  const price = Number(value);
  return Number.isFinite(price) ? Math.round(price) : null;
}

export function parseStock(raw: string): { label: string; available: boolean } {
  const label = raw.trim();
  const normalized = label.toLowerCase();
  if (!label) return { label: "Consultar", available: true };
  if (["agotado", "sin stock", "no disponible", "no"].includes(normalized)) {
    return { label: "Sin stock", available: false };
  }
  if (/^\d+$/.test(normalized)) {
    const quantity = Number(normalized);
    return quantity > 0
      ? { label: `${quantity} u.`, available: true }
      : { label: "Sin stock", available: false };
  }
  if (["si", "sí", "disponible", "hay", "ok"].includes(normalized)) {
    return { label: "Disponible", available: true };
  }
  return { label, available: true };
}

function safeUrl(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "ver") return null;
  const absolute = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : trimmed.startsWith("mods/") || trimmed.startsWith("images/")
      ? `${STORE_ORIGIN}/${trimmed.replace(/^\/+/, "")}`
      : null;
  if (!absolute) return null;
  try {
    const url = new URL(absolute);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function productId(code: string, name: string, used: Set<string>): string {
  const base = (code.trim() || name.trim() || "producto")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  let id = base || "producto";
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

function sheetRows(sheet: SheetTable): { row: number; values: Map<number, string> }[] {
  const byRow = new Map<number, Map<number, string>>();
  for (const [cell, value] of sheet.cells) {
    const row = rowNumber(cell);
    const column = columnIndex(cell);
    const values = byRow.get(row) ?? new Map<number, string>();
    values.set(column, value);
    byRow.set(row, values);
  }
  return [...byRow.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, values]) => ({ row, values }));
}

function findHeader(rows: { row: number; values: Map<number, string> }[]) {
  for (const entry of rows) {
    const headers = new Map<string, number>();
    for (const [column, value] of entry.values) {
      const key = normalizeHeader(value);
      if (key) headers.set(key, column);
    }
    if (headers.has("producto") && (headers.has("seccion") || headers.has("precio"))) {
      return { row: entry.row, headers };
    }
  }
  return null;
}

function columnOf(headers: Map<string, number>, names: string[]): number | undefined {
  for (const name of names) {
    const column = headers.get(name);
    if (column != null) return column;
  }
  for (const [header, column] of headers) {
    if (names.some((name) => header.startsWith(name))) return column;
  }
  return undefined;
}

function columnValues(sheet: SheetTable, headerName: string): string[] {
  const rows = sheetRows(sheet);
  const header = rows.find((entry) =>
    [...entry.values.values()].some((value) => normalizeHeader(value) === headerName),
  );
  if (!header) return [];
  const column = [...header.values.entries()].find(
    ([, value]) => normalizeHeader(value) === headerName,
  )?.[0];
  if (column == null) return [];
  return rows
    .filter((entry) => entry.row > header.row)
    .map((entry) => entry.values.get(column)?.trim() ?? "")
    .filter(Boolean);
}

function cellLink(sheet: SheetTable, row: number, column: number | undefined): string | null {
  if (column == null) return null;
  return safeUrl(sheet.links.get(`${columnLetters(column)}${row}`));
}

export function parseCatalog(sheets: SheetTable[], fetchedAt: string): Catalog {
  const catalogSheet =
    sheets.find((sheet) => normalizeHeader(sheet.name) === "catalogo") ?? sheets[0];
  if (!catalogSheet) throw new Error("La hoja no tiene una pestaña de catálogo.");

  const rows = sheetRows(catalogSheet);
  const header = findHeader(rows);
  if (!header) throw new Error("No encontré la fila de columnas del catálogo.");

  const sectionCol = columnOf(header.headers, ["seccion"]);
  const brandCol = columnOf(header.headers, ["marca"]);
  const nameCol = columnOf(header.headers, ["producto"]);
  const codeCol = columnOf(header.headers, ["codigo"]);
  const presentationCol = columnOf(header.headers, ["presentacion"]);
  const imageCol = columnOf(header.headers, ["imagen"]);
  const priceCol = columnOf(header.headers, ["precio"]);
  const stockCol = columnOf(header.headers, ["stock"]);
  const linkCol = columnOf(header.headers, ["link", "enlace", "url"]);

  const usedIds = new Set<string>();
  const products: Product[] = [];
  let currentSection = "";

  for (const entry of rows) {
    if (entry.row <= header.row) continue;
    const read = (column: number | undefined) =>
      column == null ? "" : (entry.values.get(column) ?? "").trim();
    const name = read(nameCol);
    const section = read(sectionCol);
    if (section) currentSection = section;
    if (!name) continue;

    const code = read(codeCol);
    const stock = parseStock(read(stockCol));
    const imageUrl = safeUrl(read(imageCol));
    const productUrl = cellLink(catalogSheet, entry.row, linkCol) ?? safeUrl(read(linkCol));

    products.push({
      id: productId(code, name, usedIds),
      section: section || currentSection || "Sin sección",
      brand: read(brandCol),
      name,
      code,
      presentation: read(presentationCol),
      imageUrl,
      price: parsePrice(read(priceCol)),
      stockLabel: stock.label,
      available: stock.available,
      productUrl,
    });
  }

  const orderedSections: string[] = [];
  const pushSection = (value: string) => {
    const section = value.trim();
    if (section && !orderedSections.includes(section)) orderedSections.push(section);
  };
  const sectionSheet = sheets.find((sheet) => normalizeHeader(sheet.name) === "secciones");
  if (sectionSheet) {
    for (const section of columnValues(sectionSheet, "seccion")) pushSection(section);
  }
  for (const product of products) pushSection(product.section);

  const brands = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es"),
  );

  return { products, sections: orderedSections, brands, fetchedAt };
}
