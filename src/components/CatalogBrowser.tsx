"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
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
  const focusSearch = searchParams.get("buscar") === "1";
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSearch) searchRef.current?.focus();
  }, [focusSearch]);

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
    params.delete("buscar");
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
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold text-[var(--color-primary)]">
          Volver
        </Link>
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight">{section || "Catálogo"}</h1>
      </div>
      <p className="muted mt-1 text-xs">
        {visible.length} productos · {formatDateTime(catalog.fetchedAt)}
      </p>

      <form className="glass mt-4 grid gap-3 p-3" onSubmit={(event) => event.preventDefault()}>
        <label className="block text-sm font-semibold">
          Buscar
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Producto, marca o código"
            className="control mt-1"
          />
        </label>
        <label className="block text-sm font-semibold">
          Sección
          <select
            value={section}
            onChange={(event) => update({ seccion: event.target.value })}
            className="control mt-1"
          >
            <option value="">Todas las secciones</option>
            {catalog.sections.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Marca
          <select
            value={brand}
            onChange={(event) => update({ marca: event.target.value })}
            className="control mt-1"
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
        <p className="glass muted mt-6 px-4 py-8 text-center" role="status">
          No hay productos con esos filtros.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {grouped.map((group) => (
            <section key={group.name} aria-label={group.name}>
              {section ? null : (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                  {group.name}
                </h2>
              )}
              <div className={`grid grid-cols-2 gap-3 ${section ? "" : "mt-3"}`}>
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
