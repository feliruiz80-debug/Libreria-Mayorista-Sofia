"use client";

import { useEffect, useRef, useState } from "react";

/** Muestra Actualizar cuando el sitio instalado ya tiene una versión nueva esperando. */
export function UpdateButton() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const asked = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let ignore = false;
    let timer = 0;

    function onControllerChange() {
      if (!asked.current) return;
      window.location.reload();
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => undefined);
      }
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    document.addEventListener("visibilitychange", onVisible);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (ignore) return;

        const show = (worker: ServiceWorker | null) => {
          if (worker && navigator.serviceWorker.controller) setWaiting(worker);
        };

        show(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed") show(worker);
          });
        });

        timer = window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 60 * 60 * 1000);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="px-3 pb-2">
      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() => {
          asked.current = true;
          waiting.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        Actualizar
      </button>
    </div>
  );
}
