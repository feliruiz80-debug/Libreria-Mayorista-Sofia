"use client";

import Image from "next/image";
import { useState } from "react";
import { QuantityControl } from "@/components/QuantityControl";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import { sellingUnit } from "@/lib/selling-unit";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { quantityOf, setQuantity } = useCart();
  const inCart = quantityOf(product.id);
  const unit = sellingUnit(product.presentation);
  const [draft, setDraft] = useState(unit.step);
  const price = product.price == null ? "Consultar" : formatMoney(product.price);
  const shown = inCart > 0 ? inCart : draft;

  function commit(quantity: number) {
    const next = quantity <= 0 ? 0 : Math.max(unit.step, quantity);
    setDraft(next === 0 ? unit.step : next);
    if (inCart > 0 || next > 0) setQuantity(product.id, next, product.price);
  }

  return (
    <article className="panel flex h-full flex-col overflow-hidden">
      <div className="relative aspect-square bg-[var(--color-bg)]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`Foto de ${product.name}`}
            fill
            unoptimized
            sizes="(max-width: 32rem) 50vw, 16rem"
            className="object-contain p-3"
          />
        ) : (
          <div className="muted grid h-full place-items-center px-3 text-center text-xs font-semibold">
            {product.brand || "Sin foto"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
          {product.code ? `Cód. ${product.code}` : product.brand || "Sin código"}
        </p>
        <h3 className="line-clamp-2 text-balance text-base leading-snug">{product.name}</h3>
        <p className="price text-base">{price}</p>
        <p className="muted text-xs">Se vende por {unit.label}</p>
        {product.available ? (
          <div className="mt-auto grid gap-2">
            <QuantityControl
              quantity={shown}
              step={unit.step}
              label={product.name}
              onChange={(next) => {
                if (inCart > 0) commit(next);
                else setDraft(next <= 0 ? unit.step : next);
              }}
            />
            <button type="button" className="btn btn-primary w-full" onClick={() => commit(shown)}>
              Agregar
            </button>
            {inCart > 0 ? <p className="muted text-center text-xs">En el pedido: {inCart}</p> : null}
          </div>
        ) : (
          <button type="button" disabled className="btn btn-secondary mt-auto w-full">
            Sin stock
          </button>
        )}
      </div>
    </article>
  );
}
