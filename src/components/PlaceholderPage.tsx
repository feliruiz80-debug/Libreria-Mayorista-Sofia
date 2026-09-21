type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600">{description}</p>
      <p className="mt-6 rounded-md border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500">
        Esta sección es un marcador de posición. Se implementará en una etapa
        posterior.
      </p>
    </section>
  );
}
