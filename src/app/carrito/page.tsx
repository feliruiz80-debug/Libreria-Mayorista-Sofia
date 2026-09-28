import { CartView } from "@/components/CartView";
import { getCatalog } from "@/lib/sheets/catalog";

export const metadata = {
  title: "Pedido · Librería Mayorista Sofía",
};

export default async function CarritoPage() {
  let products: Awaited<ReturnType<typeof getCatalog>>["products"] = [];
  try {
    products = (await getCatalog()).products;
  } catch {
    products = [];
  }
  return <CartView products={products} />;
}
