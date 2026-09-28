import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Librería Mayorista Sofía",
    short_name: "Sofía",
    description: "Catálogo y pedidos de Librería Mayorista Sofía.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f1ea",
    theme_color: "#f6f1ea",
    lang: "es-AR",
    icons: [
      { src: "/logo.webp", sizes: "192x192", type: "image/webp", purpose: "any" },
      { src: "/logo.webp", sizes: "512x512", type: "image/webp", purpose: "any" },
    ],
  };
}
