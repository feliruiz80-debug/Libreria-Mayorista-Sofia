/**
 * La unidad de venta ya viene en la columna Presentación de la hoja
 * (unidad, bulto, caja, estuche…). No se cambia la lectura del catálogo:
 * solo se interpreta ese texto.
 * Si la celda trae un mínimo explícito ("bulto x 6", "mínimo 12" o un número solo),
 * la cantidad salta de a ese paso y no baja de ahí, salvo para quitar el producto.
 */
export function sellingUnit(presentation: string): { label: string; step: number } {
  const raw = presentation.replace(/\s+/g, " ").trim();
  if (!raw) return { label: "unidad", step: 1 };

  const onlyNumber = /^(\d{1,4})$/.exec(raw);
  if (onlyNumber) return { label: "unidad", step: Math.max(1, Number(onlyNumber[1])) };

  const explicit = /(?:m[ií]n(?:imo)?\.?|bulto|pack|caja)\s*[x×:]?\s*(\d{1,4})\b/i.exec(raw);
  const step = explicit ? Math.max(1, Number(explicit[1])) : 1;
  return { label: raw, step };
}

export function quantityLabel(presentation: string, quantity: number): string {
  const { label } = sellingUnit(presentation);
  return `${quantity} × ${label}`;
}
