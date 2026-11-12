// Offline support: the app is saved on the phone; when online it picks up the newest copy.
const V = "bench-202611121100";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-180.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    // the page itself: newest copy when online, the saved copy when offline or the network is slow
    e.respondWith((async () => {
      const cache = await caches.open(V);
      const saved = await cache.match("index.html");
      const net = fetch(req).then((res) => { if (res.ok) cache.put("index.html", res.clone()); return res; });
      if (!saved) return net;
      return Promise.race([net.catch(() => saved), new Promise((r) => setTimeout(() => r(saved), 2500))]);
    })());
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(V).then((c) => c.put(req, copy)); }
    return res;
  })));
});
