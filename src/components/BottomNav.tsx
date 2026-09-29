"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useCart } from "@/components/CartProvider";

const items = [
  { id: "home", href: "/", label: "Inicio" },
  { id: "promos", href: "/catalogo?seccion=PROMOS", label: "Promos" },
  { id: "search", href: "/catalogo?buscar=1", label: "Buscar" },
  { id: "cart", href: "/carrito", label: "Carrito" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { count } = useCart();
  const section = searchParams.get("seccion");
  const searching = searchParams.get("buscar") === "1";
  const gesture = useRef({
    y: null as number | null,
    last: null as number | null,
    swiped: false,
    pathname,
    searching,
    query: searchParams.toString(),
  });

  useEffect(() => {
    gesture.current.pathname = pathname;
    gesture.current.searching = searching;
    gesture.current.query = searchParams.toString();
  });

  useEffect(() => {
    function onMove(event: PointerEvent) {
      if (gesture.current.y == null) return;
      gesture.current.last = event.clientY;
    }

    function onUp(event: PointerEvent) {
      const state = gesture.current;
      if (state.y == null) return;
      const end = event.type === "pointercancel" ? (state.last ?? state.y) : event.clientY;
      const delta = state.y - end;
      state.y = null;
      state.last = null;
      if (delta > 42) {
        state.swiped = true;
        const params = new URLSearchParams(state.pathname === "/catalogo" ? state.query : "");
        params.set("buscar", "1");
        const href = `/catalogo?${params.toString()}`;
        if (state.pathname === "/catalogo") router.replace(href, { scroll: false });
        else router.push(href);
      } else if (delta < -42 && state.pathname === "/catalogo" && state.searching) {
        state.swiped = true;
        const params = new URLSearchParams(state.query);
        params.delete("buscar");
        const query = params.toString();
        router.replace(query ? `/catalogo?${query}` : "/catalogo", { scroll: false });
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [router]);

  function searchHref() {
    const params = new URLSearchParams(pathname === "/catalogo" ? searchParams.toString() : "");
    if (searching && pathname === "/catalogo") params.delete("buscar");
    else params.set("buscar", "1");
    const query = params.toString();
    return query ? `/catalogo?${query}` : "/catalogo";
  }

  function onPointerDown(event: ReactPointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gesture.current.y = event.clientY;
    gesture.current.last = event.clientY;
    gesture.current.swiped = false;
  }

  function active(id: (typeof items)[number]["id"]) {
    if (id === "home") return pathname === "/";
    if (id === "cart") return pathname === "/carrito";
    if (id === "promos") return pathname === "/catalogo" && section === "PROMOS" && !searching;
    if (id === "search") return searching;
    return false;
  }

  return (
    <nav
      className="dock"
      aria-label="Navegación principal"
      onPointerDown={onPointerDown}
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const isActive = active(item.id);
          return (
            <Link
              key={item.id}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              href={item.id === "search" ? searchHref() : item.href}
              onClick={(event) => {
                if (!gesture.current.swiped) return;
                event.preventDefault();
                gesture.current.swiped = false;
              }}
              aria-current={isActive ? "page" : undefined}
              aria-expanded={item.id === "search" ? searching : undefined}
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
