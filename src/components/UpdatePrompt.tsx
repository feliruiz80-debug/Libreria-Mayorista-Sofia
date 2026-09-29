"use client";

import { useEffect, useState } from "react";

const VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
const DISMISS_KEY = "sofia-update-later";

export function UpdatePrompt() {
  const [remoteId, setRemoteId] = useState("");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !VERSION) return;
    let stop = false;

    async function check() {
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { id?: string };
        const remote = data.id?.trim() ?? "";
        if (!remote || remote === VERSION) return;
        if (sessionStorage.getItem(DISMISS_KEY) === remote) return;
        if (!stop) setRemoteId(remote);
      } catch {
        // Sin red no hay aviso.
      }
    }

    void check();
    const timer = window.setInterval(() => void check(), 2 * 60 * 1000);
    function onVisible() {
      if (document.visibilityState === "visible") void check();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!remoteId) return null;

  return (
    <div
      className="update-banner pointer-events-none fixed inset-x-0 z-40 px-3"
      role="status"
      aria-live="polite"
    >
      <div className="panel pointer-events-auto mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <p className="text-sm font-semibold">Nueva versión disponible</p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-primary update-action" onClick={() => window.location.reload()}>
            Actualizar
          </button>
          <button
            type="button"
            className="btn btn-secondary update-action"
            onClick={() => {
              sessionStorage.setItem(DISMISS_KEY, remoteId);
              setRemoteId("");
            }}
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
