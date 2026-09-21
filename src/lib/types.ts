/**
 * Modelos de dominio previstos. Aún no hay persistencia ni lógica de negocio.
 */

export type Product = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  price: number;
  stock?: number;
};

export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Order = {
  id: string;
  customerId: string;
  items: CartItem[];
  createdAt: string;
  status: "draft" | "submitted";
};
