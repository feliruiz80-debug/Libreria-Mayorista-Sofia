import { Suspense } from "react";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { CatalogStatus } from "@/components/CatalogStatus";
import { loadCatalogResult } from "@/lib/sheets/catalog";

export const metadata = {
  title: "Catálogo · Librería Mayorista Sofía",
};

export default async function CatalogoPage() {
  const result = await loadCatalogResult();
  if (!result.ok) return <CatalogStatus message={result.message} />;

  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-[#6f675f]">Cargando catálogo…</p>}>
      <CatalogBrowser catalog={result.catalog} />
    </Suspense>
  );
}
