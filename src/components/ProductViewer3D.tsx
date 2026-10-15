"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { boxForProduct, texturesForProduct, type ProductBoxTextures } from "@/lib/product-3d";
import type { Product } from "@/lib/types";

const ANGLE_STEP = 45;
/** Vista 3/4: se ve frente, lateral y tapa — no una foto plana. */
const DEFAULT_YAW = -38;
const DEFAULT_PITCH = -18;

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
  const draggingRef = useRef(false);
  const orbitRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
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
    if (!open || !orbitRef.current) return;
    orbitRef.current.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
    if (shadowRef.current) {
      const stretch = 1 + Math.abs(Math.sin((yaw * Math.PI) / 180)) * 0.28;
      const offsetX = Math.sin((yaw * Math.PI) / 180) * 22;
      shadowRef.current.style.transform = `translateX(calc(-50% + ${offsetX}px)) scaleX(${stretch})`;
      shadowRef.current.style.opacity = String(
        0.28 + Math.abs(Math.sin((pitch * Math.PI) / 180)) * 0.14,
      );
    }
  }, [open, yaw, pitch]);

  function applyOrientation(nextYaw: number, nextPitch: number) {
    yawRef.current = nextYaw;
    pitchRef.current = nextPitch;
    setYaw(nextYaw);
    setPitch(nextPitch);
  }

  function nudge(direction: -1 | 1) {
    applyOrientation(yawRef.current + direction * ANGLE_STEP, pitchRef.current);
  }

  function onStagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    draggingRef.current = true;

    const startX = event.clientX;
    const startY = event.clientY;
    const originYaw = yawRef.current;
    const originPitch = pitchRef.current;

    function onMove(ev: PointerEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      applyOrientation(
        originYaw + dx * 0.4,
        Math.max(-42, Math.min(22, originPitch - dy * 0.28)),
      );
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
        <div className="box-viewer__studio" aria-hidden="true" />
        <div ref={shadowRef} className="box-viewer__shadow" aria-hidden="true" />

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

        <p className="box-viewer__hint">Caja 3D · deslizá para girar</p>
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
  textures: ProductBoxTextures;
};

/** Prisma rectangular con 6 caras + solapa: geometría de caja, no una foto girando. */
function ProductBox3D({ width: w, height: h, depth: d, textures }: BoxProps) {
  const halfD = d / 2;
  const halfW = w / 2;
  const halfH = h / 2;
  const tabH = Math.round(h * 0.1);
  const tabW = Math.round(w * 0.7);

  const face = (url: string, extra: CSSProperties = {}): CSSProperties => ({
    backgroundImage: `url(${url})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    backgroundPosition: "center",
    ...extra,
  });

  return (
    <div className="product-box3d" style={{ width: w, height: h }} aria-hidden="true">
      {textures.tab ? (
        <div
          className="product-box3d__tab"
          style={face(textures.tab, {
            width: tabW,
            height: tabH,
            left: (w - tabW) / 2,
            top: -tabH + 1,
            transform: `translateZ(${-halfD + 0.5}px)`,
          })}
        />
      ) : null}

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
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--right"
        style={face(textures.right, {
          width: d,
          height: h,
          left: halfW - halfD,
          transform: `rotateY(90deg) translateZ(${halfW}px)`,
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--left"
        style={face(textures.left, {
          width: d,
          height: h,
          left: halfW - halfD,
          transform: `rotateY(-90deg) translateZ(${halfW}px)`,
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--top"
        style={face(textures.top, {
          width: w,
          height: d,
          top: halfH - halfD,
          transform: `rotateX(90deg) translateZ(${halfH}px)`,
        })}
      />
      <div
        className="product-box3d__face product-box3d__face--bottom"
        style={face(textures.bottom, {
          width: w,
          height: d,
          top: halfH - halfD,
          transform: `rotateX(-90deg) translateZ(${halfH}px)`,
        })}
      />
    </div>
  );
}
