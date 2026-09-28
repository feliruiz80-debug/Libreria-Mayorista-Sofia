"use client";

type QuantityControlProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  label: string;
  /** Paso de la unidad de venta (1 unidad, o el bulto mínimo si la hoja lo indica). */
  step?: number;
};

export function QuantityControl({ quantity, onChange, label, step = 1 }: QuantityControlProps) {
  const jump = step > 0 ? step : 1;
  return (
    <div className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--color-text)_18%,transparent)] bg-[color-mix(in_srgb,var(--color-bg)_80%,white)]">
      <button
        type="button"
        aria-label={`Quitar ${jump} de ${label}`}
        className="grid h-12 w-12 place-items-center rounded-full text-xl text-[var(--color-text)]"
        onClick={() => onChange(quantity - jump < jump ? 0 : quantity - jump)}
      >
        −
      </button>
      <span className="min-w-8 text-center text-base font-semibold tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label={`Agregar ${jump} de ${label}`}
        className="grid h-12 w-12 place-items-center rounded-full text-xl text-[var(--color-text)]"
        onClick={() => onChange(quantity + jump)}
      >
        +
      </button>
    </div>
  );
}
