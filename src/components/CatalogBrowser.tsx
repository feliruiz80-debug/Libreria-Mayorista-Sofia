"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { formatDateTime } from "@/lib/format";
import type { Catalog, Product } from "@/lib/types";

function matches(product: Product, query: string, section: string, brand: string) {
  if (section && product.section !== section) return false;
  if (brand && product.brand !== brand) return false;
  if (!query) return true;
  const haystack = [product.name, product.brand, product.code, product.section, product.presentation]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function CatalogBrowser({ catalog }: { catalog: Catalog }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const section = searchParams.get("seccion") ?? "";
  const brand = searchParams.get("marca") ?? "";

  const visible = useMemo(
    () => catalog.products.filter((product) => matches(product, query.trim(), section, brand)),
    [catalog.products, query, section, brand],
  );

  function update(next: { q?: string; seccion?: string; marca?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const values = {
      q: next.q ?? query,
      seccion: next.seccion ?? section,
      marca: next.marca ?? brand,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const suffix = params.toString();
    router.replace(suffix ? `/catalogo?${suffix}` : "/catalogo", { scroll: false });
  }

  const grouped = catalog.sections
    .map((name) => ({
      name,
      products: visible.filter((product) => product.section === name),
    }))
    .filter((group) => group.products.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1b1d21]">Catálogo</h1>
          <p className="mt-2 text-sm text-[#6f675f]">
            {catalog.products.length} productos · precios leídos el{" "}
            {formatDateTime(catalog.fetchedAt)}
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-3 rounded-2xl border border-black/5 bg-white p-3 sm:grid-cols-[1fr_14rem_14rem]"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block">
          <span className="sr-only">Buscar</span>
          <input
            value={query}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Buscar producto, marca o código"
            className="h-11 w-full rounded-xl border border-black/10 bg-[#f7f4ef] px-3 text-sm outline-none ring-[#e92026] focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="sr-only">Sección</span>
          <select
            value={section}
            onChange={(event) => update({ seccion: event.target.value })}
            className="h-11 w-full rounded-xl border border-black/10 bg-[#f7f4ef] px-3 text-sm outline-none ring-[#e92026] focus:ring-2"
          >
            <option value="">Todas las secciones</option>
            {catalog.sections.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Marca</span>
          <select
            value={brand}
            onChange={(event) => update({ marca: event.target.value })}
            className="h-11 w-full rounded-xl border border-black/10 bg-[#f7f4ef] px-3 text-sm outline-none ring-[#e92026] focus:ring-2"
          >
            <option value="">Todas las marcas</option>
            {catalog.brands.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </form>

      {grouped.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-8 text-center text-[#6f675f]">
          No hay productos con esos filtros.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map((group) => (
            <section key={group.name}>
              <h2 className="text-sm font-semibold tracking-wide text-[#6f675f]">{group.name}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
