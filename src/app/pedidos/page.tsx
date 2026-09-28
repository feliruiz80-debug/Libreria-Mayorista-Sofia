import { Suspense } from "react";
import { LoadingState } from "@/components/LoadingState";
import { OrdersView } from "@/components/OrdersView";

export const metadata = {
  title: "Mis pedidos · Librería Mayorista Sofía",
};

export default function PedidosPage() {
  return (
    <Suspense fallback={<LoadingState label="Cargando pedidos…" />}>
      <OrdersView />
    </Suspense>
  );
}
