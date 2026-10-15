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

const STUDIO_ANGLE_STEP = 36;
const DEFAULT_TILT = -18;

const PENCIL_ROWS = [
  ["#c62828", "#ef6c00", "#f9a825", "#fdd835", "#9e9d24", "#558b2f"],
  ["#2e7d32", "#00897b", "#0277bd", "#1565c0", "#283593", "#6a1b9a"],
  ["#ad1457", "#6d4c41", "#455a64", "#212121", "#ec407a", "#26a69a"],
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
  const yawRef = useRef(-32);
  const pitchRef = useRef(DEFAULT_TILT);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const orbitRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const [yaw, setYaw] = useState(-32);
  const [pitch, setPitch] = useState(DEFAULT_TILT);
  const filgo = isFilgoColoredPencils(product);
  const imageUrl = product.imageUrl;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    yawRef.current = -32;
    pitchRef.current = DEFAULT_TILT;
    velocityRef.current = 0;
    setYaw(-32);
    setPitch(DEFAULT_TILT);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const tick = () => {
      if (!draggingRef.current && Math.abs(velocityRef.current) > 0.02) {
        yawRef.current += velocityRef.current;
        velocityRef.current *= 0.94;
        setYaw(yawRef.current);
      } else if (!draggingRef.current) {
        velocityRef.current = 0;
      }

      if (orbitRef.current) {
        orbitRef.current.style.transform = `rotateX(${pitchRef.current}deg) rotateY(${yawRef.current}deg)`;
      }
      if (shadowRef.current) {
        const stretch = 1 + Math.abs(Math.sin((yawRef.current * Math.PI) / 180)) * 0.18;
        const offsetX = Math.sin((yawRef.current * Math.PI) / 180) * 18;
        shadowRef.current.style.transform = `translateX(${offsetX}px) scaleX(${stretch})`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]);

  function close() {
    onClose();
  }

  function nudge(direction: -1 | 1) {
    velocityRef.current = 0;
    yawRef.current += direction * STUDIO_ANGLE_STEP;
    setYaw(yawRef.current);
  }

  function onStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    velocityRef.current = 0;

    const startX = event.clientX;
    const startY = event.clientY;
    const originYaw = yawRef.current;
    const originPitch = pitchRef.current;
    let lastX = startX;
    let lastT = performance.now();

    function onMove(ev: PointerEvent) {
      const now = performance.now();
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      yawRef.current = originYaw + dx * 0.42;
      pitchRef.current = Math.max(-38, Math.min(12, originPitch - dy * 0.28));
      setYaw(yawRef.current);
      setPitch(pitchRef.current);

      const dt = Math.max(16, now - lastT);
      velocityRef.current = ((ev.clientX - lastX) / dt) * 14;
      lastX = ev.clientX;
      lastT = now;
    }

    function onUp() {
      draggingRef.current = false;
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  if (!imageUrl) return null;

  return (
    <dialog
      ref={dialogRef}
      className="studio-viewer"
      aria-labelledby={titleId}
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <button type="button" className="studio-viewer__close" onClick={close} aria-label="Cerrar">
        <span aria-hidden="true">×</span>
      </button>

      <div
        className="studio-viewer__stage"
        onPointerDown={onStagePointerDown}
        role="application"
        aria-label="Visor 3D interactivo. Deslizá o usá las flechas para girar."
      >
        <div className="studio-viewer__glow" aria-hidden="true" />
        <div ref={shadowRef} className="studio-viewer__shadow" aria-hidden="true" />

        <div
          ref={orbitRef}
          className="studio-viewer__orbit"
          style={{ transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)` }}
        >
          {filgo ? (
            <FilgoStudioProduct imageUrl={imageUrl} />
          ) : (
            <StudioProductPlate imageUrl={imageUrl} name={product.name} />
          )}
        </div>

        <button
          type="button"
          className="studio-viewer__nav studio-viewer__nav--prev"
          onClick={() => nudge(-1)}
          aria-label="Girar a la izquierda"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          className="studio-viewer__nav studio-viewer__nav--next"
          onClick={() => nudge(1)}
          aria-label="Girar a la derecha"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <footer className="studio-viewer__footer">
        <p className="studio-viewer__brand">{product.brand || "Producto"}</p>
        <h2 id={titleId} className="studio-viewer__title">
          {product.name}
        </h2>
        <p className="studio-viewer__hint">Deslizá · girá en 360°</p>
      </footer>
    </dialog>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StudioProductPlate({ imageUrl, name }: { imageUrl: string; name: string }) {
  return (
    <div className="studio-plate" aria-hidden="true">
      <div className="studio-plate__face studio-plate__face--front">
        <Image src={imageUrl} alt="" fill unoptimized sizes="80vw" className="object-contain p-5" />
      </div>
      <div className="studio-plate__face studio-plate__face--back" />
      <div className="studio-plate__face studio-plate__face--left" />
      <div className="studio-plate__face studio-plate__face--right" />
      <div className="studio-plate__face studio-plate__face--top" />
      <div className="studio-plate__face studio-plate__face--bottom" />
      <span className="sr-only">{name}</span>
    </div>
  );
}

function FilgoStudioProduct({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="filgo-studio" aria-hidden="true">
      <div className="filgo-studio__tin">
        <div className="filgo-studio__tin-body">
          <div className="filgo-studio__tin-inner">
            {PENCIL_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="filgo-studio__row" style={{ ["--row" as string]: rowIndex }}>
                {row.map((color, i) => (
                  <span
                    key={`${color}-${i}`}
                    className="filgo-studio__pencil"
                    style={{
                      ["--pencil" as string]: color,
                      ["--i" as string]: i,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="filgo-studio__rim" />
          <div className="filgo-studio__badge">
            <Image src={imageUrl} alt="" width={120} height={120} unoptimized className="object-contain" />
          </div>
        </div>
        <div className="filgo-studio__lid">
          <div className="filgo-studio__lid-face">
            <span>FILGO</span>
            <small>Lápices de color</small>
          </div>
        </div>
      </div>

      <div className="filgo-studio__loose filgo-studio__loose--a">
        <span className="filgo-studio__pencil is-loose" style={{ ["--pencil" as string]: "#c62828" }} />
      </div>
      <div className="filgo-studio__loose filgo-studio__loose--b">
        <span className="filgo-studio__pencil is-loose" style={{ ["--pencil" as string]: "#1565c0" }} />
      </div>
    </div>
  );
}
