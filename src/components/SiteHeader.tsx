import Link from "next/link";

const links = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/clientes", label: "Clientes" },
  { href: "/carrito", label: "Carrito" },
  { href: "/pedidos", label: "Pedidos" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-semibold tracking-tight text-stone-900">
          Librería Mayorista Sofía
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
