"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Product } from "@/lib/types";

const PENCIL_COLORS = [
  "#e92026",
  "#f59e0b",
  "#facc15",
  "#22c55e",
  "#0ea5e9",
  "#014d9b",
  "#7c3aed",
  "#ec4899",
  "#78716c",
  "#111827",
  "#fb7185",
  "#34d399",
];

function isFilgoColoredPencils(product: Product) {
  const brand = product.brand.toLowerCase();
  const name = product.name.toLowerCase();
  const haystack = `${brand} ${name}`;
  const isFilgo = brand.includes("filgo") || name.includes("filgo");
  const isPencils =
    haystack.includes("lápiz") ||
    haystack.includes("lapiz") ||
    haystack.includes("lápices") ||
    haystack.includes("lapices") ||
    (haystack.includes("color") && (haystack.includes("caja") || haystack.includes("set")));
  return isFilgo && isPencils;
}

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

export function ProductViewer3D({ product, open, onClose }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState(0);
  const [rotation, setRotation] = useState({ x: -12, y: -28 });
  const filgo = isFilgoColoredPencils(product);
  const imageUrl = product.imageUrl;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    setPanel(0);
    setRotation({ x: -12, y: -28 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function close() {
    onClose();
  }

  function onStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { ...rotation };
    let moved = false;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      setRotation({
        x: Math.max(-42, Math.min(28, origin.x - dy * 0.35)),
        y: origin.y + dx * 0.45,
      });
    }

    function onUp(ev: PointerEvent) {
      target.releasePointerCapture(ev.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!moved && Math.abs(ev.clientX - startX) < 4) {
        /* keep tap from accidental close */
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function onCarouselPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-viewer-stage]")) return;
    const startX = event.clientX;
    const startPanel = panel;
    let dx = 0;

    function onMove(ev: PointerEvent) {
      dx = ev.clientX - startX;
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (dx < -56) setPanel(1);
      else if (dx > 56) setPanel(0);
      else setPanel(startPanel);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  if (!imageUrl) return null;

  return (
    <dialog
      ref={dialogRef}
      className="product-viewer"
      aria-labelledby={titleId}
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="product-viewer__chrome">
        <button type="button" className="product-viewer__close" onClick={close} aria-label="Cerrar">
          ×
        </button>
        <div className="min-w-0 flex-1">
          <p className="kicker">{product.brand || "Producto"}</p>
          <h2 id={titleId} className="truncate text-lg font-semibold leading-tight">
            {product.name}
          </h2>
        </div>
      </div>

      <div
        className="product-viewer__track"
        style={{ transform: `translateX(-${panel * 100}%)` }}
        onPointerDown={onCarouselPointerDown}
      >
        <section className="product-viewer__panel" aria-label="Foto del producto">
          <div className="product-viewer__photo">
            <Image
              src={imageUrl}
              alt={`Foto de ${product.name}`}
              fill
              unoptimized
              sizes="100vw"
              className="object-contain p-6"
              priority
            />
          </div>
          <p className="product-viewer__hint">Deslizá al costado para la vista 3D</p>
        </section>

        <section className="product-viewer__panel" aria-label="Vista 3D interactiva">
          <div
            ref={stageRef}
            data-viewer-stage
            className="product-viewer__stage"
            onPointerDown={onStagePointerDown}
            role="application"
            aria-label="Visor 3D del producto. Arrastrá para girar."
          >
            <div className="product-viewer__floor" aria-hidden="true" />
            <div
              className="product-viewer__orbit"
              style={{
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              }}
            >
              {filgo ? <FilgoPencilPack imageUrl={imageUrl} name={product.name} /> : (
                <div className="product-viewer__card">
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="80vw"
                    className="object-contain p-4"
                  />
                </div>
              )}
            </div>
          </div>
          <p className="product-viewer__hint">Arrastrá o deslizá para girar el producto</p>
        </section>
      </div>

      <div className="product-viewer__dots" aria-hidden="true">
        <span className={panel === 0 ? "is-active" : undefined} />
        <span className={panel === 1 ? "is-active" : undefined} />
      </div>
      <div className="product-viewer__tabs">
        <button type="button" className={panel === 0 ? "is-active" : undefined} onClick={() => setPanel(0)}>
          Foto
        </button>
        <button type="button" className={panel === 1 ? "is-active" : undefined} onClick={() => setPanel(1)}>
          Vista 3D
        </button>
      </div>
    </dialog>
  );
}

function FilgoPencilPack({ imageUrl, name }: { imageUrl: string; name: string }) {
  return (
    <div className="filgo-pack" aria-hidden="true">
      <div className="filgo-pack__box">
        <Image src={imageUrl} alt="" fill unoptimized sizes="60vw" className="object-contain p-3" />
      </div>
      <div className="filgo-pack__fan">
        {PENCIL_COLORS.map((color, index) => {
          const mid = (PENCIL_COLORS.length - 1) / 2;
          const offset = index - mid;
          return (
            <span
              key={color}
              className="filgo-pencil"
              style={{
                ["--pencil" as string]: color,
                transform: `translate(-50%, -50%) rotateZ(${offset * 7.2}deg) translateY(${Math.abs(offset) * 2}px) rotateX(8deg)`,
                zIndex: Math.round(20 - Math.abs(offset)),
              }}
            />
          );
        })}
      </div>
      <p className="filgo-pack__label">Filgo · {name.includes("color") ? "Lápices de color" : "Pack"}</p>
    </div>
  );
}
