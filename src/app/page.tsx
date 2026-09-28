import Link from "next/link";
import { CatalogStatus } from "@/components/CatalogStatus";
import { loadCatalogResult } from "@/lib/sheets/catalog";

export const revalidate = 300;

const tones = ["bg-[#fff1f1]", "bg-[#fff8eb]", "bg-[#f3f7ff]", "bg-[#f3fff6]", "bg-[#f8f3ff]"];

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
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a8178]">Secciones</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {catalog.sections.map((section, index) => {
          const count = counts.get(section) ?? 0;
          const promos = section.toUpperCase() === "PROMOS";
          return (
            <Link
              key={section}
              href={`/catalogo?seccion=${encodeURIComponent(section)}`}
              className={`flex min-h-32 flex-col justify-between rounded-3xl p-4 shadow-[0_8px_24px_rgba(27,29,33,0.06)] ${
                index === 0 ? "col-span-2 min-h-40" : ""
              } ${promos ? "bg-[#e92026] text-white" : tones[index % tones.length]}`}
            >
              <span className={`text-xs font-semibold ${promos ? "text-white/80" : "text-[#8a8178]"}`}>
                {count} productos
              </span>
              <span className="text-xl font-semibold leading-tight tracking-tight">{section}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
