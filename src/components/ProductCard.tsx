"use client";

import Image from "next/image";
import { QuantityControl } from "@/components/QuantityControl";
import { useCart } from "@/components/CartProvider";
import { formatMoney } from "@/lib/format";
import { STORE_WHATSAPP } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { quantityOf, setQuantity } = useCart();
  const quantity = quantityOf(product.id);
  const price = product.price == null ? "Consultar" : formatMoney(product.price);

  function askOnWhatsApp() {
    const text = [
      "Hola, consulto por este producto:",
      product.name,
      product.brand,
      product.code ? `Código: ${product.code}` : "",
      `Precio: ${price}`,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`;
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_24px_rgba(27,29,33,0.06)]">
      <div className="relative aspect-square bg-[#f7f3ee]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="50vw"
            className="object-contain p-3"
          />
        ) : (
          <div className="grid h-full place-items-center px-3 text-center text-xs font-semibold text-[#8a8178]">
            {product.brand || "Sin foto"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#e92026]">
            {product.brand || "Sin marca"}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
          <p className="mt-1 text-base font-semibold">{price}</p>
        </div>
        <div className="mt-auto flex items-center gap-2">
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
                className="h-10 flex-1 rounded-full bg-[#e92026] text-sm font-semibold text-white"
                onClick={() => setQuantity(product.id, 1)}
              >
                Agregar
              </button>
            )
          ) : (
            <button
              type="button"
              disabled
              className="h-10 flex-1 rounded-full bg-[#ece7e1] text-sm font-semibold text-[#8a8178]"
            >
              Sin stock
            </button>
          )}
          <button
            type="button"
            aria-label={`Consultar ${product.name} por WhatsApp`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#128C7E] text-xs font-bold text-white"
            onClick={askOnWhatsApp}
          >
            WA
          </button>
        </div>
      </div>
    </article>
  );
}
