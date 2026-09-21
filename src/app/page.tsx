const upcoming = [
  "Catálogo de productos",
  "Precios",
  "Clientes",
  "Carrito y generación de pedidos",
  "Conexión con Google Sheets",
  "Publicación en Vercel",
];

export default function Home() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
        Estructura inicial
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
        Librería Mayorista Sofía
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
        Proyecto preparado con Next.js, TypeScript y Tailwind CSS. Esta etapa
        solo deja la base para GitHub y Vercel; el catálogo, los pedidos y
        Google Sheets se agregan después.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {upcoming.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
