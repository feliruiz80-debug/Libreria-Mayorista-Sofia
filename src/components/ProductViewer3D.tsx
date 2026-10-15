"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { boxForProduct, texturesForProduct } from "@/lib/product-3d";
import type { Product } from "@/lib/types";

const ANGLE_STEP = 40;
const DEFAULT_YAW = -32;
const DEFAULT_PITCH = -16;

type Props = {
  product: Product;
  open: boolean;
  onClose: () => void;
};

export function ProductViewer3D({ product, open, onClose }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const yawRef = useRef(DEFAULT_YAW);
  const pitchRef = useRef(DEFAULT_PITCH);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const orbitRef = useRef<HTMLDivElement>(null);
  const [yaw, setYaw] = useState(DEFAULT_YAW);
  const [pitch, setPitch] = useState(DEFAULT_PITCH);

  const textures = texturesForProduct(product);
  const box = boxForProduct(product);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    yawRef.current = DEFAULT_YAW;
    pitchRef.current = DEFAULT_PITCH;
    velocityRef.current = 0;
    setYaw(DEFAULT_YAW);
    setPitch(DEFAULT_PITCH);
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
        velocityRef.current *= 0.93;
        setYaw(yawRef.current);
      } else if (!draggingRef.current) {
        velocityRef.current = 0;
      }

      if (orbitRef.current) {
        orbitRef.current.style.transform = `rotateX(${pitchRef.current}deg) rotateY(${yawRef.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]);

  function nudge(direction: -1 | 1) {
    velocityRef.current = 0;
    yawRef.current += direction * ANGLE_STEP;
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
      yawRef.current = originYaw + dx * 0.45;
      pitchRef.current = Math.max(-42, Math.min(16, originPitch - dy * 0.28));
      setYaw(yawRef.current);
      setPitch(pitchRef.current);

      const dt = Math.max(16, now - lastT);
      velocityRef.current = ((ev.clientX - lastX) / dt) * 16;
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

  if (!textures) return null;

  return (
    <dialog
      ref={dialogRef}
      className="box-viewer"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={titleId} className="sr-only">
        {product.name}
      </h2>

      <button type="button" className="box-viewer__close" onClick={onClose} aria-label="Cerrar">
        ×
      </button>

      <div
        className="box-viewer__stage"
        onPointerDown={onStagePointerDown}
        role="application"
        aria-label={`${product.name}. Deslizá para girar la caja en 3D.`}
      >
        <div
          ref={orbitRef}
          className="box-viewer__orbit"
          style={{
            width: box.width,
            height: box.height,
            transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)`,
          }}
        >
          <ProductBox3D
            width={box.width}
            height={box.height}
            depth={box.depth}
            textures={textures}
          />
        </div>

        <button
          type="button"
          className="box-viewer__nav box-viewer__nav--prev"
          onClick={() => nudge(-1)}
          aria-label="Girar a la izquierda"
        >
          <Chevron direction="left" />
        </button>
        <button
          type="button"
          className="box-viewer__nav box-viewer__nav--next"
          onClick={() => nudge(1)}
          aria-label="Girar a la derecha"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </dialog>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type BoxProps = {
  width: number;
  height: number;
  depth: number;
  textures: {
    front: string;
    back: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
  };
};

/** Caja rectangular fina: foto real al frente, laterales de packaging. */
function ProductBox3D({ width: w, height: h, depth: d, textures }: BoxProps) {
  const halfD = d / 2;
  const halfW = w / 2;
  const halfH = h / 2;

  const face = (url: string, extra: CSSProperties = {}): CSSProperties => ({
    backgroundImage: `url(${url})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...extra,
  });

  return (
    <div className="product-box3d" style={{ width: w, height: h }} aria-hidden="true">
      <div
        className="product-box3d__face product-box3d__face--front"
        style={face(textures.front, {
          width: w,
          height: h,
          transform: `translateZ(${halfD}px)`,
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--back"
        style={face(textures.back, {
          width: w,
          height: h,
          transform: `rotateY(180deg) translateZ(${halfD}px)`,
          filter: "brightness(0.78) saturate(0.92)",
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--right"
        style={face(textures.right, {
          width: d,
          height: h,
          left: halfW - halfD,
          transform: `rotateY(90deg) translateZ(${halfW}px)`,
          filter: "brightness(0.9)",
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--left"
        style={face(textures.left, {
          width: d,
          height: h,
          left: halfW - halfD,
          transform: `rotateY(-90deg) translateZ(${halfW}px)`,
          filter: "brightness(0.92)",
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--top"
        style={face(textures.top, {
          width: w,
          height: d,
          top: halfH - halfD,
          transform: `rotateX(90deg) translateZ(${halfH}px)`,
          filter: "brightness(1.04)",
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--bottom"
        style={face(textures.bottom, {
          width: w,
          height: d,
          top: halfH - halfD,
          transform: `rotateX(-90deg) translateZ(${halfH}px)`,
          filter: "brightness(0.68)",
        })}
      />
    </div>
  );
}
