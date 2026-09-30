"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { QuantityControl } from "@/components/QuantityControl";
import { useCart } from "@/components/CartProvider";
import {
  getCustomerProfileSnapshot,
  getServerCustomerProfileSnapshot,
  patchCustomerProfile,
  saveCustomerProfile,
  subscribeCustomerProfile,
} from "@/lib/customer-profile";
import { formatMoney, lineTotal, orderTotal } from "@/lib/format";
import { saveOrderImage } from "@/lib/save-order-image";
import { orderCode } from "@/lib/order-code";
import { saveOrder } from "@/lib/orders-storage";
import { quantityLabel, sellingUnit } from "@/lib/selling-unit";
import { openOrderOnWhatsApp, whatsappLabel, whatsappNumber } from "@/lib/whatsapp";
import type { Order, Product } from "@/lib/types";

export function CartView({ products }: { products: Product[] }) {
  const { items, setQuantity, remove, clear } = useCart();
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const profile = useSyncExternalStore(
    subscribeCustomerProfile,
    getCustomerProfileSnapshot,
    getServerCustomerProfileSnapshot,
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Order | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const number = whatsappNumber();
  const label = whatsappLabel();

  const { customerName, businessName, cuit, phone, address, delivery } = profile;

  const lines = items.map((item) => ({ item, product: byId.get(item.productId) }));
  const known = lines.filter((line) => line.product);
  const units = known.reduce((sum, line) => sum + line.item.quantity, 0);
  const subtotal = known.every((line) => line.product?.price != null)
    ? known.reduce((sum, line) => sum + (line.product?.price ?? 0) * line.item.quantity, 0)
    : null;

  useEffect(() => {
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product || item.unitPrice === product.price) continue;
      setQuantity(item.productId, item.quantity, product.price);
    }
  }, [items, byId, setQuantity]);

  function buildOrder(): Order | null {
    const cuitDigits = cuit.replace(/\D/g, "");
    if (!customerName.trim() || !businessName.trim() || !phone.trim() || !address.trim()) {
      setError("Completá nombre, comercio, teléfono y localidad o dirección.");
      return null;
    }
    if (cuitDigits && cuitDigits.length !== 11) {
      setError("El CUIL o CUIT tiene que tener 11 números, o dejalo vacío.");
      return null;
    }
    if (known.length === 0) {
      setError("Agregá al menos un producto del catálogo.");
      return null;
    }
    setError("");
    const formattedCuit = cuitDigits
      ? `${cuitDigits.slice(0, 2)}-${cuitDigits.slice(2, 10)}-${cuitDigits.slice(10)}`
      : "";
    saveCustomerProfile({
      customerName: customerName.trim(),
      businessName: businessName.trim(),
      cuit: formattedCuit,
      phone: phone.trim(),
      address: address.trim(),
      delivery,
    });
    return {
      id: draft?.id ?? crypto.randomUUID(),
      createdAt: draft?.createdAt ?? new Date().toISOString(),
      customerName: customerName.trim(),
      businessName: businessName.trim(),
      cuit: formattedCuit,
      phone: phone.trim(),
      note: note.trim(),
      delivery,
      address: address.trim(),
      shippingCost: null,
      estimatedShipDate: "",
      items: known.map(({ item, product }) => ({
        productId: item.productId,
        name: product?.name ?? "Producto",
        code: product?.code ?? "",
        presentation: product?.presentation ?? "",
        unitPrice: product?.price ?? null,
        quantity: item.quantity,
      })),
    };
  }

  function review(event: FormEvent) {
    event.preventDefault();
    const order = buildOrder();
    if (!order) return;
    setDraft(order);
    dialogRef.current?.showModal();
  }

  function sendWhatsApp() {
    if (!draft) return;
    if (!number) {
      setError("Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER.");
      return;
    }
    saveCustomerProfile({
      customerName: draft.customerName,
      businessName: draft.businessName,
      cuit: draft.cuit,
      phone: draft.phone,
      address: draft.address,
      delivery: draft.delivery,
    });
    saveOrder(draft);
    clear();
    dialogRef.current?.close();
    openOrderOnWhatsApp(draft);
  }

  return (
    <div className="grid gap-4 px-4 py-4">
      <section className="panel p-4">
        <p className="kicker">Pedido</p>
        <h1 className="display mt-1 text-4xl leading-none">Tu pedido</h1>
        <p className="muted mt-1 text-sm">
          {label
            ? `Al confirmar se abre WhatsApp ${label} con el pedido escrito.`
            : "Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER para poder enviarlo."}
        </p>
        {lines.length === 0 ? (
          <div className="mt-6 px-2 py-8 text-center">
            <p className="muted">Todavía no agregaste productos.</p>
            <Link href="/catalogo" className="btn btn-primary mt-4">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[color-mix(in_srgb,var(--color-text)_12%,transparent)]">
            {lines.map(({ item, product }) => {
              const unit = sellingUnit(product?.presentation ?? "");
              return (
                <li key={item.productId} className="flex flex-col gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{product?.name ?? "Este producto ya no está en el catálogo"}</p>
                    <p className="muted mt-1 text-sm">
                      {product
                        ? [product.code && `Cód. ${product.code}`, quantityLabel(product.presentation, item.quantity)]
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
                  <div className="flex flex-wrap items-center gap-3">
                    {product ? (
                      <QuantityControl
                        quantity={item.quantity}
                        step={unit.step}
                        label={product.name}
                        onChange={(quantity) => setQuantity(item.productId, quantity, product.price)}
                      />
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-secondary min-h-12 px-4 text-sm"
                      onClick={() => remove(item.productId)}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form onSubmit={review} className="panel grid gap-3 p-4">
        <h2 className="display text-3xl leading-none">Datos del pedido</h2>
        <p className="muted text-sm">Se guardan en este celular para el próximo pedido.</p>
        <Field
          label="Nombre y apellido"
          value={customerName}
          onChange={(value) => patchCustomerProfile({ customerName: value })}
          autoComplete="name"
          required
        />
        <Field
          label="Razón social / nombre del comercio"
          value={businessName}
          onChange={(value) => patchCustomerProfile({ businessName: value })}
          autoComplete="organization"
          required
        />
        <Field
          label="CUIL o CUIT (opcional)"
          value={cuit}
          onChange={(value) => patchCustomerProfile({ cuit: value })}
          inputMode="numeric"
          autoComplete="off"
          placeholder="20-12345678-9"
        />
        <Field
          label="Teléfono"
          value={phone}
          onChange={(value) => patchCustomerProfile({ phone: value })}
          type="tel"
          autoComplete="tel"
          required
        />
        <Field
          label="Localidad / dirección"
          value={address}
          onChange={(value) => patchCustomerProfile({ address: value })}
          autoComplete="street-address"
          required
        />
        <fieldset>
          <legend className="text-sm font-semibold">Forma de entrega</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Choice
              selected={delivery === "retiro"}
              onClick={() => patchCustomerProfile({ delivery: "retiro" })}
              label="Retiro en local"
            />
            <Choice
              selected={delivery === "envio"}
              onClick={() => patchCustomerProfile({ delivery: "envio" })}
              label="Envío"
            />
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">
          Observaciones
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="control mt-1"
          />
        </label>
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="muted">Unidades</dt>
            <dd>{units}</dd>
          </div>
          <div className="flex justify-between gap-3 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{subtotal == null ? "A confirmar" : formatMoney(subtotal)}</dd>
          </div>
        </dl>
        {error ? (
          <p className="text-sm font-semibold text-[var(--color-primary)]" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary w-full" disabled={known.length === 0}>
          Revisar pedido
        </button>
        <p className="muted text-xs leading-relaxed">Precios y stock sujetos a confirmación.</p>
        <Link href="/pedidos" className="text-sm font-semibold text-[var(--color-primary)]">
          Ver pedidos guardados
        </Link>
      </form>

      <dialog ref={dialogRef} className="panel" aria-labelledby="confirmar-pedido">
        {draft ? (
          <div className="grid gap-3">
            <h2 id="confirmar-pedido" className="display text-3xl leading-none">
              Pedido N° {orderCode(draft)}
            </h2>
            <p className="text-sm">
              {draft.customerName} · {draft.businessName}
              {draft.cuit ? ` · CUIL/CUIT ${draft.cuit}` : ""}
            </p>
            <p className="muted text-sm">
              {draft.phone} · {draft.address} · {draft.delivery === "envio" ? "Envío" : "Retiro en local"}
            </p>
            <ul className="max-h-48 space-y-2 overflow-auto text-sm">
              {draft.items.map((item) => (
                <li key={item.productId}>
                  <span className="font-semibold">{item.code || "Sin código"}</span> · {item.name}
                  <br />
                  {quantityLabel(item.presentation, item.quantity)} ·{" "}
                  {lineTotal(item.unitPrice, item.quantity) == null
                    ? "A confirmar"
                    : formatMoney(lineTotal(item.unitPrice, item.quantity) ?? 0)}
                </li>
              ))}
            </ul>
            <p className="text-lg font-semibold">
              {draft.items.reduce((sum, item) => sum + item.quantity, 0)} unidades ·{" "}
              {orderTotal(draft) == null ? "Total a confirmar" : formatMoney(orderTotal(draft) ?? 0)}
            </p>
            <p className="text-sm">{draft.note || "Sin observaciones"}</p>
            <p className="muted text-xs">Precios y stock sujetos a confirmación.</p>
            <button type="button" className="btn btn-primary w-full" onClick={sendWhatsApp} disabled={!number}>
              Enviar por WhatsApp
            </button>
            <button type="button" className="btn btn-secondary w-full" onClick={() => saveOrderImage(draft)}>
              Guardar PDF
            </button>
            <button type="button" className="btn btn-secondary w-full" onClick={() => dialogRef.current?.close()}>
              Volver a editar
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function Choice({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-12 rounded-[1.75rem] border px-3 py-3 text-sm font-semibold ${
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
          : "btn-secondary"
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
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  inputMode?: "decimal" | "text" | "numeric";
  type?: "text" | "tel";
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="control mt-1"
      />
    </label>
  );
}
