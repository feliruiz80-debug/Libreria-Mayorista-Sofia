"use client";

import Image from "next/image";
import { QuantityControl } from "@/components/QuantityControl";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { quantityOf, setQuantity } = useCart();
  const quantity = quantityOf(product.id);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(27,29,33,0.04)]">
      <div className="relative aspect-square bg-[#f3efe8]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-4"
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-sm text-[#8a8178]">
            {product.brand || "Sin foto"}
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            product.available ? "bg-white text-[#1f7a3a]" : "bg-[#1b1d21] text-white"
          }`}
        >
          {product.stockLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#e92026]">
            {product.brand || "Sin marca"}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-[#1b1d21]">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-[#6f675f]">
            {[product.code && `Cód. ${product.code}`, product.presentation]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <p className="text-xl font-semibold tracking-tight text-[#1b1d21]">
          {product.price == null ? "Consultar" : formatMoney(product.price)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3">
          {product.available ? (
            quantity > 0 ? (
              <QuantityControl
                quantity={quantity}
                label={product.name}
                onChange={(next) => setQuantity(product.id, next)}
              />
            ) : (
              <button
                type="button"
                className="rounded-full bg-[#e92026] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#cf1b21]"
                onClick={() => setQuantity(product.id, 1)}
              >
                Agregar
              </button>
            )
          ) : (
            <button
              type="button"
              disabled
              className="rounded-full bg-[#ece7e1] px-4 py-2.5 text-sm font-semibold text-[#8a8178]"
            >
              Sin stock
            </button>
          )}
          {product.productUrl ? (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-[#3a3532] underline-offset-4 hover:underline"
            >
              Ver ficha
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
