// Service worker: cache cangkang aplikasi agar halaman terbuka instan.
// Data absensi (Google Apps Script) TIDAK pernah di-cache.
const VERSI = 'assyifa-v1';
const SHELL = ['./','index.html','riwayat.html','belum-absen.html','input-admin.html','dashboard-admin.html',
  'config.js','pwa.js','manifest.json','icons/logo.png','icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==VERSI).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // script.google.com, fonts: langsung ke jaringan
  // stale-while-revalidate: tampil cepat dari cache, diam-diam perbarui di belakang
  e.respondWith(caches.open(VERSI).then(async c => {
    const cached = await c.match(e.request, {ignoreSearch:true});
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(()=>cached);
    return cached || net;
  }));
});
