import { unstable_cache } from "next/cache";
import type { Catalog, Product } from "@/lib/types";
import { parseCatalog } from "@/lib/sheets/parse-catalog";
import { readWorkbook } from "@/lib/sheets/xlsx";

const DEFAULT_SPREADSHEET_ID = "1-WXoquIhApc3KUPvnc9hIoLuflveXR94BS-qr2w_S6Y";
const STORE_ORIGIN = "https://www.mayoristasofia.com.ar";

function spreadsheetId(): string {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() || DEFAULT_SPREADSHEET_ID;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function imageFromProductPage(productUrl: string): Promise<string | null> {
  try {
    const response = await fetch(productUrl, {
      headers: { "user-agent": "LibreriaMayoristaSofia/1.0" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const src = /id="piSelected"[^>]*\ssrc="([^"]+)"/.exec(html)?.[1];
    if (!src) return null;
    const absolute = src.startsWith("http") ? src : `${STORE_ORIGIN}/${src.replace(/^\/+/, "")}`;
    const url = new URL(absolute);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function withImages(products: Product[]): Promise<Product[]> {
  const deadline = Date.now() + 15000;
  return mapPool(products, 6, async (product) => {
    if (product.imageUrl || !product.productUrl || Date.now() > deadline) return product;
    const imageUrl = await imageFromProductPage(product.productUrl);
    return imageUrl ? { ...product, imageUrl } : product;
  });
}

async function loadCatalog(): Promise<Catalog> {
  const id = spreadsheetId();
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
    {
      headers: { "user-agent": "LibreriaMayoristaSofia/1.0" },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) {
    throw new Error(
      "No pude leer la hoja de Google. Tiene que estar compartida como «Cualquier persona con el enlace puede ver».",
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const catalog = parseCatalog(readWorkbook(buffer), new Date().toISOString());
  return { ...catalog, products: await withImages(catalog.products) };
}

export const getCatalog = unstable_cache(loadCatalog, ["sofia-catalog-v1"], {
  revalidate: 300,
});

export async function loadCatalogResult(): Promise<
  { ok: true; catalog: Catalog } | { ok: false; message: string }
> {
  try {
    return { ok: true, catalog: await getCatalog() };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No pude leer la hoja de Google en este momento.",
    };
  }
}
