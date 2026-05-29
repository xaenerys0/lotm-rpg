// Minimal service worker.
//
// Its sole purpose is to satisfy PWA installability so browsers (notably
// Android Chrome) surface the install prompt. There is intentionally no
// offline caching: the fetch handler is a no-op and all requests fall through
// to the network. Its presence is what makes the app installable as an app.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the browser handle every request normally (network only).
});
