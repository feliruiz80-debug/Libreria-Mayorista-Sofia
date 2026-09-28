import { Suspense } from "react";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { CatalogStatus } from "@/components/CatalogStatus";
import { LoadingState } from "@/components/LoadingState";
import { loadCatalogResult } from "@/lib/sheets/catalog";

export const metadata = {
  title: "Catálogo · Librería Mayorista Sofía",
};

export default async function CatalogoPage() {
  const result = await loadCatalogResult();
  if (!result.ok) return <CatalogStatus message={result.message} />;

  return (
    <Suspense fallback={<LoadingState label="Cargando catálogo…" />}>
      <CatalogBrowser catalog={result.catalog} />
    </Suspense>
  );
}
