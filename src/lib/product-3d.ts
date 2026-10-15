import type { Product } from "@/lib/types";

export type BoxSize = {
  width: number;
  height: number;
  depth: number;
};

export type ProductBoxTextures = {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
  tab?: string;
};

const FILGO_PINTO_FRONT = "/products/filgo-pinto-front.jpg";
const FILGO_PINTO_SIDE = "/products/filgo-pinto-side.jpg";
const FILGO_PINTO_EDGE = "/products/filgo-pinto-edge.jpg";
const FILGO_PINTO_TAB = "/products/filgo-pinto-tab.jpg";

/** Caja Filgo Pinto real: alta, angosta y fina (pack colgante). */
export const FILGO_PINTO_BOX: BoxSize = {
  width: 176,
  height: 448,
  depth: 26,
};

export function isFilgoPintoBox(product: Product) {
  const brand = product.brand.toLowerCase();
  const name = product.name.toLowerCase();
  const haystack = `${brand} ${name}`;
  const isFilgo = brand.includes("filgo") || name.includes("filgo");
  const isPinto = name.includes("pinto");
  const isPencils =
    haystack.includes("lápiz") ||
    haystack.includes("lapiz") ||
    haystack.includes("lápices") ||
    haystack.includes("lapices") ||
    haystack.includes("color");
  return isFilgo && (isPinto || isPencils);
}

export function boxForProduct(product: Product): BoxSize {
  if (isFilgoPintoBox(product)) return FILGO_PINTO_BOX;
  return { width: 200, height: 260, depth: 28 };
}

export function texturesForProduct(product: Product): ProductBoxTextures | null {
  if (!product.imageUrl) return null;

  if (isFilgoPintoBox(product)) {
    return {
      front: FILGO_PINTO_FRONT,
      back: FILGO_PINTO_FRONT,
      left: FILGO_PINTO_SIDE,
      right: FILGO_PINTO_SIDE,
      top: FILGO_PINTO_EDGE,
      bottom: FILGO_PINTO_EDGE,
      tab: FILGO_PINTO_TAB,
    };
  }

  const src = product.imageUrl;
  return {
    front: src,
    back: src,
    left: src,
    right: src,
    top: src,
    bottom: src,
  };
}
