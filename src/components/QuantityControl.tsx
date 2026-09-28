"use client";

type QuantityControlProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  label: string;
};

export function QuantityControl({ quantity, onChange, label }: QuantityControlProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-black/10 bg-white">
      <button
        type="button"
        aria-label={`Quitar uno de ${label}`}
        className="grid h-10 w-10 place-items-center rounded-full text-lg text-[#1b1d21] hover:bg-[#f7f4ef]"
        onClick={() => onChange(quantity - 1)}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label={`Agregar uno de ${label}`}
        className="grid h-10 w-10 place-items-center rounded-full text-lg text-[#1b1d21] hover:bg-[#f7f4ef]"
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
