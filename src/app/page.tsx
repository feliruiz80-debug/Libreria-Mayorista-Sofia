import Link from "next/link";
import { CatalogStatus } from "@/components/CatalogStatus";
import { loadCatalogResult } from "@/lib/sheets/catalog";

export const revalidate = 300;

export default async function Home() {
  const result = await loadCatalogResult();
  if (!result.ok) return <CatalogStatus message={result.message} />;
  const { catalog } = result;

  const counts = new Map<string, number>();
  for (const product of catalog.products) {
    counts.set(product.section, (counts.get(product.section) ?? 0) + 1);
  }

  return (
    <div className="px-4 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)]">Secciones</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {catalog.sections.map((section, index) => {
          const count = counts.get(section) ?? 0;
          const promos = section.toUpperCase() === "PROMOS";
          return (
            <Link
              key={section}
              href={`/catalogo?seccion=${encodeURIComponent(section)}`}
              className={`glass lift flex min-h-32 flex-col justify-between p-4 ${
                index === 0 ? "col-span-2 min-h-40" : ""
              }`}
            >
              <span className="muted text-xs font-semibold">{count} productos</span>
              <span
                className={`text-xl font-semibold leading-tight tracking-tight ${
                  promos ? "text-[var(--color-accent)]" : ""
                }`}
              >
                {section}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
