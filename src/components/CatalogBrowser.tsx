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
  const sheetRef = useRef<HTMLElement>(null);
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
    const target = event.target as HTMLElement;
    if (target.closest("input, button")) return;
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

  const productList =
    grouped.length === 0 ? (
      <p className="panel muted mt-6 px-4 py-8 text-center" role="status">
        No hay productos para esa búsqueda.
      </p>
    ) : (
      <div className="mt-5 space-y-6">
        {grouped.map((group) => (
          <section key={group.name} aria-label={group.name}>
            {section ? null : <h2 className="kicker">{group.name}</h2>}
            <div className={`grid grid-cols-2 gap-3 ${section ? "" : "mt-3"}`}>
              {group.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );

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
        <section ref={sheetRef} className="search-sheet" aria-label="Buscar">
          <div
            className="search-handle"
            onPointerDown={onHandleStart}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleEnd}
            onPointerCancel={onHandleEnd}
          >
            <span className="search-grab" aria-hidden="true" />
          </div>
          <form className="search-field" onSubmit={(event) => event.preventDefault()}>
            <svg className="h-5 w-5 shrink-0 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <label className="min-w-0 flex-1">
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
            <button type="button" className="search-close" onClick={closeSearch} aria-label="Cerrar búsqueda">
              ×
            </button>
          </form>
          <div className="search-body">{productList}</div>
        </section>
      ) : (
        productList
      )}
    </div>
  );
}
