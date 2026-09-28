export function CatalogStatus({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">No pude leer el catálogo</h1>
      <p className="mt-3 text-[#6f675f]">{message}</p>
    </div>
  );
}
