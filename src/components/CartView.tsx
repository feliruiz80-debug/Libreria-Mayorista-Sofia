"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { QuantityControl } from "@/components/QuantityControl";
import { useCart } from "@/components/CartProvider";
import { formatMoney, formatShipDate, lineTotal, parseAmount } from "@/lib/format";
import { saveOrder } from "@/lib/orders-storage";
import { openOrderOnWhatsApp, STORE_WHATSAPP_LABEL } from "@/lib/whatsapp";
import type { Order, Product } from "@/lib/types";

export function CartView({ products }: { products: Product[] }) {
  const { items, setQuantity, remove, clear } = useCart();
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [delivery, setDelivery] = useState<"retiro" | "envio">("retiro");
  const [address, setAddress] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [estimatedShipDate, setEstimatedShipDate] = useState("");
  const [error, setError] = useState("");

  const lines = items.map((item) => ({ item, product: byId.get(item.productId) }));
  const known = lines.filter((line) => line.product);
  const subtotal = known.every((line) => line.product?.price != null)
    ? known.reduce((sum, line) => sum + (line.product?.price ?? 0) * line.item.quantity, 0)
    : null;
  const parsedShipping = parseAmount(shippingCost);
  const shippingAmount = delivery === "envio" && parsedShipping.ok ? parsedShipping.amount : null;
  const payable =
    subtotal == null || (delivery === "envio" && shippingAmount == null)
      ? null
      : subtotal + (delivery === "envio" ? (shippingAmount ?? 0) : 0);

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
    if (delivery === "envio" && !address.trim()) {
      setError("Completá la dirección para el envío.");
      return;
    }
    if (delivery === "envio" && !parsedShipping.ok) {
      setError("El costo de envío no es un importe válido. Si todavía no está definido, dejalo vacío.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(estimatedShipDate)) {
      setError("Elegí una fecha de envío estimada.");
      return;
    }

    const order: Order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      businessName: businessName.trim(),
      phone: phone.trim(),
      note: note.trim(),
      delivery,
      address: delivery === "envio" ? address.trim() : "",
      shippingCost: delivery === "envio" ? shippingAmount : null,
      estimatedShipDate,
      items: known.map(({ item, product }) => ({
        productId: item.productId,
        name: product?.name ?? "Producto",
        code: product?.code ?? "",
        presentation: product?.presentation ?? "",
        unitPrice: product?.price ?? null,
        quantity: item.quantity,
      })),
    };

    setError("");
    saveOrder(order);
    clear();
    openOrderOnWhatsApp(order);
  }

  return (
    <div className="grid gap-6 px-4 py-4">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Tu pedido</h1>
        <p className="mt-1 text-sm text-[#6f675f]">
          Se abre el chat de WhatsApp {STORE_WHATSAPP_LABEL} con la nota de pedido. En WhatsApp
          solo tenés que tocar Enviar.
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
        <h2 className="text-lg font-semibold">Datos para la nota</h2>
        <div className="mt-4 space-y-3">
          <Field label="Nombre" value={customerName} onChange={setCustomerName} required />
          <Field label="Comercio" value={businessName} onChange={setBusinessName} />
          <Field label="Teléfono" value={phone} onChange={setPhone} required />
          <div>
            <p className="text-sm font-medium text-[#3a3532]">Entrega</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Choice
                selected={delivery === "retiro"}
                onClick={() => setDelivery("retiro")}
                label="Retiro en el local"
              />
              <Choice
                selected={delivery === "envio"}
                onClick={() => setDelivery("envio")}
                label="Envío a domicilio"
              />
            </div>
          </div>
          {delivery === "envio" ? (
            <>
              <Field label="Dirección de envío" value={address} onChange={setAddress} required />
              <Field
                label="Costo de envío"
                value={shippingCost}
                onChange={setShippingCost}
                inputMode="decimal"
                placeholder="Vacío = a coordinar"
              />
            </>
          ) : null}
          <Field
            label="Fecha de envío estimada"
            value={estimatedShipDate}
            onChange={setEstimatedShipDate}
            type="date"
            required
          />
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
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[#6f675f]">Subtotal</dt>
            <dd>{subtotal == null ? "A confirmar" : formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6f675f]">Envío</dt>
            <dd>
              {delivery === "retiro"
                ? "Retiro en el local"
                : shippingAmount == null
                  ? "A coordinar"
                  : formatMoney(shippingAmount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#6f675f]">Fecha estimada</dt>
            <dd>{estimatedShipDate ? formatShipDate(estimatedShipDate) : "A elegir"}</dd>
          </div>
          <div className="flex justify-between gap-3 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{payable == null ? "A confirmar" : formatMoney(payable)}</dd>
          </div>
        </dl>
        {error ? <p className="mt-2 text-sm text-[#e92026]">{error}</p> : null}
        <button
          type="submit"
          className="mt-4 w-full rounded-full bg-[#128C7E] px-4 py-3 text-sm font-semibold text-white disabled:bg-[#ece7e1] disabled:text-[#8a8178]"
          disabled={known.length === 0}
        >
          Enviar
        </button>
        <p className="mt-3 text-xs leading-relaxed text-[#6f675f]">
          Igual que en Bebu: se abre tu chat {STORE_WHATSAPP_LABEL} con la nota ya escrita. Solo
          falta tocar Enviar en WhatsApp.
        </p>
        <Link href="/pedidos" className="mt-3 inline-flex text-sm font-semibold text-[#e92026]">
          Ver pedidos guardados
        </Link>
      </form>
    </div>
  );
}

function Choice({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
        selected
          ? "border-[#e92026] bg-[#fff1f1] text-[#e92026]"
          : "border-black/10 bg-[#f7f4ef] text-[#3a3532]"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  inputMode,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  inputMode?: "decimal" | "text";
  type?: "text" | "date";
}) {
  return (
    <label className="block text-sm font-medium text-[#3a3532]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-[#f7f4ef] px-3 text-sm font-normal outline-none ring-[#e92026] placeholder:text-[#a39890] focus:ring-2"
      />
    </label>
  );
}
