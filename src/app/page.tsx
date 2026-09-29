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
      <p className="kicker">Secciones</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {catalog.sections.map((section, index) => {
          const count = counts.get(section) ?? 0;
          const promos = section.toUpperCase() === "PROMOS";
          return (
            <Link
              key={section}
              href={`/catalogo?seccion=${encodeURIComponent(section)}`}
              className={`panel lift flex min-h-32 min-w-0 flex-col justify-between p-5 ${
                index === 0 ? "col-span-2 min-h-40" : ""
              }`}
            >
              <span className="kicker">{count} productos</span>
              <span
                className={`display text-balance leading-[0.95] ${
                  index === 0 ? "text-[1.85rem]" : "text-[1.45rem]"
                } ${promos ? "text-[var(--color-accent)]" : ""}`}
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
