"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { QuantityControl } from "@/components/QuantityControl";
import { useCart } from "@/components/CartProvider";
import { formatMoney, lineTotal } from "@/lib/format";
import { saveOrder } from "@/lib/orders-storage";
import { openStoreWhatsApp, STORE_WHATSAPP_LABEL } from "@/lib/whatsapp";
import type { Order, Product } from "@/lib/types";

export function CartView({ products }: { products: Product[] }) {
  const { items, setQuantity, remove, clear } = useCart();
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const lines = items.map((item) => ({ item, product: byId.get(item.productId) }));
  const known = lines.filter((line) => line.product);
  const total = known.every((line) => line.product?.price != null)
    ? known.reduce((sum, line) => sum + (line.product?.price ?? 0) * line.item.quantity, 0)
    : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!customerName.trim() || !phone.trim()) {
      setError("Completá el nombre y el teléfono para armar el pedido.");
      return;
    }
    if (known.length === 0) {
      setError("Agregá al menos un producto del catálogo.");
      return;
    }
    setSending(true);
    const order: Order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      businessName: businessName.trim(),
      phone: phone.trim(),
      note: note.trim(),
      items: known.map(({ item, product }) => ({
        productId: item.productId,
        name: product?.name ?? "Producto",
        code: product?.code ?? "",
        presentation: product?.presentation ?? "",
        unitPrice: product?.price ?? null,
        quantity: item.quantity,
      })),
    };
    saveOrder(order);
    clear();
    openStoreWhatsApp(order);
  }

  return (
    <div className="grid gap-6 px-4 py-4">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Tu pedido</h1>
        <p className="mt-1 text-sm text-[#6f675f]">
          El PDF se abre en el WhatsApp {STORE_WHATSAPP_LABEL}.
        </p>
        {lines.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-10 text-center">
            <p className="text-[#6f675f]">Todavía no agregaste productos.</p>
            <Link
              href="/catalogo"
              className="mt-4 inline-flex rounded-full bg-[#e92026] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white">
            {lines.map(({ item, product }) => (
              <li key={item.productId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1b1d21]">
                    {product?.name ?? "Este producto ya no está en el catálogo"}
                  </p>
                  <p className="mt-1 text-sm text-[#6f675f]">
                    {product
                      ? [product.brand, product.code && `Cód. ${product.code}`, product.presentation]
                          .filter(Boolean)
                          .join(" · ")
                      : "Sacalo del pedido para continuar."}
                  </p>
                  {product ? (
                    <p className="mt-1 text-sm font-medium">
                      {product.price == null ? "Consultar" : formatMoney(product.price)}
                      {lineTotal(product.price, item.quantity) != null
                        ? ` · ${formatMoney(lineTotal(product.price, item.quantity) ?? 0)}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {product ? (
                    <QuantityControl
                      quantity={item.quantity}
                      label={product.name}
                      onChange={(quantity) => setQuantity(item.productId, quantity)}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="text-sm font-medium text-[#e92026]"
                    onClick={() => remove(item.productId)}
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={submit} className="h-fit rounded-2xl border border-black/5 bg-white p-5">
        <h2 className="text-lg font-semibold">Datos para el pedido</h2>
        <div className="mt-4 space-y-3">
          <Field label="Nombre" value={customerName} onChange={setCustomerName} required />
          <Field label="Comercio" value={businessName} onChange={setBusinessName} />
          <Field label="Teléfono" value={phone} onChange={setPhone} required />
          <label className="block text-sm font-medium text-[#3a3532]">
            Nota
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-black/10 bg-[#f7f4ef] px-3 py-2 text-sm font-normal outline-none ring-[#e92026] focus:ring-2"
            />
          </label>
        </div>
        <p className="mt-4 text-lg font-semibold">
          Total: {total == null ? "a confirmar" : formatMoney(total)}
        </p>
        {error ? <p className="mt-2 text-sm text-[#e92026]">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white disabled:bg-[#ece7e1] disabled:text-[#8a8178]"
          disabled={known.length === 0 || sending}
        >
          {sending ? "Abriendo WhatsApp…" : "Enviar PDF por WhatsApp"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-[#6f675f]">
          Se abre el chat de la librería con el detalle y el link del PDF. Ahí solo tenés que
          tocar Enviar.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-[#3a3532]">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-[#f7f4ef] px-3 text-sm font-normal outline-none ring-[#e92026] focus:ring-2"
      />
    </label>
  );
}
