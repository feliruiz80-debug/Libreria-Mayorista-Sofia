export type Product = {
  id: string;
  section: string;
  brand: string;
  name: string;
  code: string;
  presentation: string;
  imageUrl: string | null;
  price: number | null;
  stockLabel: string;
  available: boolean;
  productUrl: string | null;
};

export type Catalog = {
  products: Product[];
  sections: string[];
  brands: string[];
  fetchedAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
  /** Precio al agregar, para el total del carrito flotante sin volver a leer la hoja. */
  unitPrice: number | null;
};

export type OrderLine = {
  productId: string;
  name: string;
  code: string;
  presentation: string;
  unitPrice: number | null;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  businessName: string;
  /** Opcional. Vacío si el cliente no lo cargó. */
  cuit: string;
  phone: string;
  note: string;
  delivery: "retiro" | "envio";
  address: string;
  shippingCost: number | null;
  /** Fecha elegida por el cliente, formato YYYY-MM-DD. */
  estimatedShipDate: string;
  items: OrderLine[];
};
