import { inflateRawSync } from "node:zlib";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;

export function unzip(data: Buffer): Map<string, Buffer> {
  let eocd = -1;
  const min = Math.max(0, data.length - 22 - 0xffff);
  for (let i = data.length - 22; i >= min; i -= 1) {
    if (data.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("El archivo de la hoja no es un Excel válido.");

  const count = data.readUInt16LE(eocd + 10);
  let cursor = data.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();

  for (let index = 0; index < count; index += 1) {
    if (data.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) {
      throw new Error("No se pudo leer el Excel de la hoja.");
    }
    const compression = data.readUInt16LE(cursor + 10);
    const compressedSize = data.readUInt32LE(cursor + 20);
    const nameLength = data.readUInt16LE(cursor + 28);
    const extraLength = data.readUInt16LE(cursor + 30);
    const commentLength = data.readUInt16LE(cursor + 32);
    const localOffset = data.readUInt32LE(cursor + 42);
    const name = data.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    cursor += 46 + nameLength + extraLength + commentLength;

    const localNameLength = data.readUInt16LE(localOffset + 26);
    const localExtraLength = data.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = data.subarray(dataStart, dataStart + compressedSize);
    const content =
      compression === 0
        ? Buffer.from(compressed)
        : compression === 8
          ? inflateRawSync(compressed)
          : null;
    if (!content) {
      throw new Error(`No se pudo descomprimir ${name}.`);
    }
    files.set(name.replace(/\\/g, "/"), content);
  }

  return files;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/&amp;/g, "&");
}

export function readSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  for (const match of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const parts = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((part) =>
      decodeXml(part[1]),
    );
    strings.push(parts.join(""));
  }
  return strings;
}

export function readCells(xml: string, sharedStrings: string[]): Map<string, string> {
  const cells = new Map<string, string>();
  for (const match of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = match[1];
    const inner = match[2] ?? "";
    const ref = /(?:^|\s)r="([A-Z]+\d+)"/.exec(attrs)?.[1];
    if (!ref) continue;
    const type = /(?:^|\s)t="([^"]+)"/.exec(attrs)?.[1];
    let value = "";
    if (type === "inlineStr") {
      value = [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((part) => decodeXml(part[1]))
        .join("");
    } else {
      const raw = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      if (raw == null) continue;
      value = decodeXml(raw);
      if (type === "s") value = sharedStrings[Number(value)] ?? "";
    }
    if (value !== "") cells.set(ref, value);
  }
  return cells;
}

export function readHyperlinks(sheetXml: string, relsXml: string): Map<string, string> {
  const targets = new Map<string, string>();
  for (const match of relsXml.matchAll(/<Relationship\b([^>]*?)\/>/g)) {
    const attrs = match[1];
    const id = /Id="([^"]+)"/.exec(attrs)?.[1];
    const target = /Target="([^"]+)"/.exec(attrs)?.[1];
    if (id && target) targets.set(id, decodeXml(target));
  }

  const links = new Map<string, string>();
  for (const match of sheetXml.matchAll(/<hyperlink\b([^>]*?)\/>/g)) {
    const attrs = match[1];
    const ref = /ref="([^"]+)"/.exec(attrs)?.[1];
    const id = /(?:r:id|id)="([^"]+)"/.exec(attrs)?.[1];
    const direct = /location="([^"]+)"|Target="([^"]+)"/.exec(attrs);
    const target = (id ? targets.get(id) : null) ?? (direct?.[1] || direct?.[2]);
    if (!ref || !target || target.startsWith("#")) continue;
    const anchor = ref.split(":")[0];
    if (anchor) links.set(anchor, target);
  }
  return links;
}

export type SheetTable = {
  name: string;
  cells: Map<string, string>;
  links: Map<string, string>;
};

export function readWorkbook(buffer: Buffer): SheetTable[] {
  const files = unzip(buffer);
  const workbook = files.get("xl/workbook.xml")?.toString("utf8");
  const workbookRels = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbook || !workbookRels) {
    throw new Error("La hoja no tiene el formato esperado.");
  }

  const relTargets = new Map<string, string>();
  for (const match of workbookRels.matchAll(/<Relationship\b([^>]*?)\/>/g)) {
    const attrs = match[1];
    const id = /Id="([^"]+)"/.exec(attrs)?.[1];
    const target = /Target="([^"]+)"/.exec(attrs)?.[1];
    if (!id || !target) continue;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\//, "")}`;
    relTargets.set(id, path.replace(/\\/g, "/"));
  }

  const shared = readSharedStrings(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "");
  const sheets: SheetTable[] = [];

  for (const match of workbook.matchAll(/<sheet\b([^>]*?)\/>/g)) {
    const attrs = match[1];
    const name = decodeXml(/name="([^"]+)"/.exec(attrs)?.[1] ?? "");
    const id = /r:id="([^"]+)"/.exec(attrs)?.[1];
    const path = id ? relTargets.get(id) : undefined;
    const xml = path ? files.get(path)?.toString("utf8") : undefined;
    if (!name || !xml || !path) continue;
    const relsPath = path.replace(/\/([^/]+)$/, "/_rels/$1.rels");
    sheets.push({
      name,
      cells: readCells(xml, shared),
      links: readHyperlinks(xml, files.get(relsPath)?.toString("utf8") ?? ""),
    });
  }

  return sheets;
}
