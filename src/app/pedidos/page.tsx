import { Suspense } from "react";
import { OrdersView } from "@/components/OrdersView";

export const metadata = {
  title: "Mis pedidos · Librería Mayorista Sofía",
};

export default function PedidosPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-[#6f675f]">Cargando pedidos…</p>}>
      <OrdersView />
    </Suspense>
  );
}
