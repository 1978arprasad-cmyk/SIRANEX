// Prajadarbar — minimal offline-first service worker
const CACHE = "prajadarbar-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./register.html",
  "./track.html",
  "./login.html",
  "./officer.html",
  "./field.html",
  "./hod.html",
  "./collector.html",
  "./transparency.html",
  "./feedback.html",
  "./css/app.css",
  "./config.js",
  "./js/i18n.js",
  "./js/supabase-init.js",
  "./js/utils.js",
  "./js/auth.js",
  "./js/api.js",
  "./js/notifications.js",
  "./manifest.webmanifest",
  "./assets/icon-192.svg",
  "./assets/icon-512.svg"
];

self.addEventListener("install", function (evt) {
  evt.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(APP_SHELL).catch(function () {});
    }).then(function () { self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (evt) {
  const req = evt.request;
  const url = new URL(req.url);
  // never cache Supabase API / Realtime
  if (url.host.indexOf("supabase.co") !== -1) return;
  // network-first for HTML, cache-first for static assets
  if (req.method === "GET" && req.headers.get("accept") && req.headers.get("accept").indexOf("text/html") !== -1) {
    evt.respondWith(
      fetch(req).then(function (r) {
        const copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return r;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }
  if (req.method === "GET") {
    evt.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (r) {
          const copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return r;
        });
      })
    );
  }
});
