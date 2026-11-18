// Offline support: keeps the app shell and PUBLIC data (weather, crops, calendar, guidance) for use without a connection.
// Private farm data (farms, plantings, reminders, alerts, account) is never cached here.
const CACHE = "agricast-v3";
const PUBLIC_API = ["/weather", "/geocode", "/sources", "/crops", "/counties", "/calendar", "/advice", "/climate", "/water-balance"];
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const shared = u.origin === self.location.origin || u.hostname.endsWith("open-meteo.com") || PUBLIC_API.some((p) => u.pathname.startsWith(p));
  if (!shared) return;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r).then((hit) => hit || caches.match("/"))));
});
