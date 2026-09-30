"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
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

  const activeIndex = items.findIndex((item) => active(item.id));
  const dockStyle = {
    "--dock-x": activeIndex < 0 ? "50%" : `${(activeIndex + 0.5) * 25}%`,
  } as CSSProperties;

  return (
    <nav
      className={activeIndex < 0 ? "dock dock-rest" : "dock"}
      style={dockStyle}
      aria-label="Navegación principal"
      onPointerDown={onPointerDown}
    >
      <div className="dock-track">
        <span className="dock-pill" aria-hidden="true" />
        <div className="dock-row">
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
                className="dock-link"
              >
                <span className="dock-ico">
                  <NavIcon id={item.id} />
                  {item.id === "cart" && count > 0 ? (
                    <span className="dock-badge">{count > 9 ? "9+" : count}</span>
                  ) : null}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function NavIcon({ id }: { id: (typeof items)[number]["id"] }) {
  if (id === "home") {
    return (
      <svg className="dock-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4.5 10.6 12 4.5l7.5 6.1V19a1 1 0 0 1-1 1h-4.1v-5.2H9.6V20H5.5a1 1 0 0 1-1-1v-8.4Z" />
      </svg>
    );
  }
  if (id === "promos") {
    return (
      <svg className="dock-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3.4 2 4.3 4.7.5-3.5 3.2 1 4.6L12 13.8 7.8 16l1-4.6L5.3 8.2l4.7-.5 2-4.3Z" />
      </svg>
    );
  }
  if (id === "search") {
    return (
      <svg className="dock-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6.15" />
        <path d="m16 16 4.2 4.2" />
      </svg>
    );
  }
  return (
    <svg className="dock-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6.2 7.2h13.4l-1.15 8H8.05L6.2 7.2Z" />
      <path d="M6.2 7.2 5.2 4.4H3" />
      <circle cx="9.2" cy="19.3" r="1.15" />
      <circle cx="16.6" cy="19.3" r="1.15" />
    </svg>
  );
}
