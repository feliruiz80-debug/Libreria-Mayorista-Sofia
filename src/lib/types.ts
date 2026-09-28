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
  phone: string;
  note: string;
  delivery: "retiro" | "envio";
  address: string;
  shippingCost: number | null;
  /** Fecha elegida por el cliente, formato YYYY-MM-DD. */
  estimatedShipDate: string;
  items: OrderLine[];
};
