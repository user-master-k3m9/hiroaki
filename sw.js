// 通信できるときは最新を取りに行き（network-first、HTTPキャッシュも通さず確認）、通信できないときは保存済みの内容で動く
// 学習の記録（localStorage・IndexedDB）には触らない。消すのは古い版のキャッシュだけ
const VER = "derm-ichimon-lock-0c2599e5";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "maskable-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k.startsWith("derm-ichimon")).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (!url.pathname.includes("/hiroaki/") && url.hostname.endsWith("github.io")) return;
    e.respondWith(caches.open(VER).then(async c => {
      const big = /\.bin$/.test(url.pathname);
      if (big) { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; }
      try { const r = await fetch(req, big ? {} : { cache: "no-cache" }); if (r && r.ok) c.put(req, r.clone()); return r; }
      catch (err) { return (await c.match(req, { ignoreSearch: true })) || (await c.match("index.html")) || Response.error(); }
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VER).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit))));
  }
});
