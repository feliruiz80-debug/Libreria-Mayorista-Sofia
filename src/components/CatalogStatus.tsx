import Link from "next/link";

export function CatalogStatus({ message }: { message: string }) {
  return (
    <div className="px-4 py-10" role="alert">
      <div className="panel p-5">
        <h1 className="display text-3xl leading-none">No pude leer el catálogo</h1>
        <p className="muted mt-3">{message}</p>
        <Link href="/" className="btn btn-primary mt-5">
          Reintentar
        </Link>
      </div>
    </div>
  );
}
