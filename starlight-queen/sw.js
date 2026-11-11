/* Starlight Queen — offline cache. After one visit with a connection, the whole game is kept on the device and plays
   with none. It answers from the cache at once and refreshes the cache quietly in the background, so a newer version
   arrives the next time the game is opened. */
const CACHE = 'starlight-queen-1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'js/core.js', 'js/audio.js', 'js/gems.js', 'js/backdrops.js', 'js/paint.js', 'js/paint-props.js', 'js/paint-life.js',
  'js/levels.js', 'js/entities.js', 'js/wonders.js', 'js/world.js', 'js/scenes.js', 'js/main.js'];
const FONTS = ['https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    await Promise.all(FONTS.map(u => fetch(u).then(r => r.ok && c.put(u, r)).catch(() => { }))); // the typefaces are a nicety: never fail the install over them
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const ours = url.origin === location.origin, font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!ours && !font) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: ours });
    const fresh = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response('', { status: 504, statusText: 'offline' });
  }));
});
