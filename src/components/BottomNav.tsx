"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";

const items = [
  { id: "home", href: "/", label: "Inicio" },
  { id: "promos", href: "/catalogo?seccion=PROMOS", label: "Promos" },
  { id: "search", href: "/catalogo?buscar=1", label: "Buscar" },
  { id: "cart", href: "/carrito", label: "Carrito" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { count } = useCart();
  const section = searchParams.get("seccion");
  const searching = searchParams.get("buscar") === "1" || Boolean(searchParams.get("q"));

  function active(id: (typeof items)[number]["id"]) {
    if (id === "home") return pathname === "/";
    if (id === "cart") return pathname === "/carrito";
    if (id === "promos") return pathname === "/catalogo" && section === "PROMOS";
    return pathname === "/catalogo" && section !== "PROMOS" && (searching || !section);
  }

  return (
    <nav className="glass" aria-label="Navegación principal">
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const isActive = active(item.id);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-semibold ${
                isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"
              }`}
            >
              <NavIcon id={item.id} />
              {item.label}
              {item.id === "cart" && count > 0 ? (
                <span className="absolute right-4 top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ id }: { id: (typeof items)[number]["id"] }) {
  const common = "h-6 w-6";
  if (id === "home") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "promos") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "search") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}
