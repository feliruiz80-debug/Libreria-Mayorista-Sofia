"use client";

import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
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
  const sheetRef = useRef<HTMLFormElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

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
    if (searchParams.get("buscar") === "1") params.set("buscar", "1");
    const suffix = params.toString();
    router.replace(suffix ? `/catalogo?${suffix}` : "/catalogo", { scroll: false });
  }

  const grouped = catalog.sections
    .map((name) => ({
      name,
      products: visible.filter((product) => product.section === name),
    }))
    .filter((group) => group.products.length > 0);

  function closeSearch() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("buscar");
    const suffix = params.toString();
    router.replace(suffix ? `/catalogo?${suffix}` : "/catalogo", { scroll: false });
  }

  function onHandleStart(event: ReactPointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { y: event.clientY, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandleMove(event: ReactPointerEvent) {
    if (!drag.current || !sheetRef.current) return;
    const dy = Math.max(0, event.clientY - drag.current.y);
    drag.current.dy = dy;
    sheetRef.current.style.transform = `translateY(${dy}px)`;
  }

  function onHandleEnd() {
    if (!drag.current || !sheetRef.current) return;
    const dy = drag.current.dy;
    drag.current = null;
    if (dy > 72) closeSearch();
    else sheetRef.current.style.transform = "";
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold text-[var(--color-primary)]">
          Volver
        </Link>
        <h1 className="display min-w-0 truncate text-3xl leading-none">{section || "Catálogo"}</h1>
      </div>
      <p className="muted mt-1 text-xs">
        {visible.length} productos · {formatDateTime(catalog.fetchedAt)}
      </p>

      {focusSearch ? (
        <form
          ref={sheetRef}
          role="search"
          className="search-sheet fixed inset-x-3 z-40 mx-auto grid max-w-lg gap-2"
          onSubmit={(event) => event.preventDefault()}
        >
          <div
            className="search-handle"
            onPointerDown={onHandleStart}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleEnd}
            onPointerCancel={onHandleEnd}
          >
            <span className="search-grab" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Buscar</p>
              <button
                type="button"
                className="min-h-10 px-1 text-sm font-semibold text-[var(--color-primary)]"
                onClick={closeSearch}
              >
                Cerrar
              </button>
            </div>
          </div>
          <label className="block text-sm font-semibold">
            <span className="sr-only">Buscar</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => update({ q: event.target.value })}
              placeholder="Producto, marca o código"
              className="control"
              aria-label="Buscar"
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
            <select value={brand} onChange={(event) => update({ marca: event.target.value })} className="control mt-1">
              <option value="">Todas las marcas</option>
              {catalog.brands.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </form>
      ) : null}

      {grouped.length === 0 ? (
        <p className="panel muted mt-6 px-4 py-8 text-center" role="status">
          No hay productos con esos filtros.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {grouped.map((group) => (
            <section key={group.name} aria-label={group.name}>
              {section ? null : (
                <h2 className="kicker">
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
