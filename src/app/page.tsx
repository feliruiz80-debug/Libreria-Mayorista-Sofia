import Link from "next/link";
import { CatalogStatus } from "@/components/CatalogStatus";
import { formatMoney } from "@/lib/format";
import { loadCatalogResult } from "@/lib/sheets/catalog";

export const revalidate = 300;

export default async function Home() {
  const result = await loadCatalogResult();
  if (!result.ok) return <CatalogStatus message={result.message} />;
  const { catalog } = result;

  const counts = new Map<string, number>();
  for (const product of catalog.products) {
    counts.set(product.section, (counts.get(product.section) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-3xl bg-[#1b1d21] px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-semibold tracking-wide text-[#ffb3b5]">Para clientes</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight">
          Armá tu pedido con el catálogo de Librería Mayorista Sofía
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
          Precios, stock y secciones salen de la hoja de la librería. Elegí productos, ajustá
          cantidades y enviá el pedido.
        </p>
        <form action="/catalogo" className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="q">
            Buscar en el catálogo
          </label>
          <input
            id="q"
            name="q"
            placeholder="Buscar producto, marca o código"
            className="h-12 flex-1 rounded-full bg-white px-4 text-sm text-[#1b1d21] outline-none"
          />
          <button
            type="submit"
            className="h-12 rounded-full bg-[#e92026] px-5 text-sm font-semibold text-white"
          >
            Buscar
          </button>
        </form>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Productos" value={String(catalog.products.length)} />
        <Stat label="Secciones" value={String(catalog.sections.length)} />
        <Stat label="Marcas" value={String(catalog.brands.length)} />
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Secciones</h2>
          <Link href="/catalogo" className="text-sm font-semibold text-[#e92026]">
            Ver todo
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {catalog.sections.map((section) => (
            <Link
              key={section}
              href={`/catalogo?seccion=${encodeURIComponent(section)}`}
              className="rounded-2xl border border-black/5 bg-white px-4 py-4 hover:border-[#e92026]"
            >
              <p className="font-semibold text-[#1b1d21]">{section}</p>
              <p className="mt-1 text-sm text-[#6f675f]">
                {counts.get(section) ?? 0} productos
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Algunos precios</h2>
        <ul className="mt-4 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white">
          {catalog.products.slice(0, 5).map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-sm text-[#6f675f]">{product.brand}</p>
              </div>
              <p className="shrink-0 font-semibold">
                {product.price == null ? "Consultar" : formatMoney(product.price)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white px-4 py-4">
      <p className="text-sm text-[#6f675f]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
