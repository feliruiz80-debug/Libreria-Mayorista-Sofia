/** El archivo cambia en cada deploy para que el celular detecte la versión nueva. */
export function GET() {
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
  const body = `const VERSION = ${JSON.stringify(version)};
self.addEventListener("install", (event) => {
  event.waitUntil(Promise.resolve(VERSION));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
