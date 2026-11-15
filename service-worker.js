/* Service Worker — Barragem · Orçamentos
   Estratégia: app shell em cache. Navegação = network-first (pega
   atualização quando há rede) com fallback para o cache (offline).
   Demais assets = cache-first. Troque CACHE_VERSION a cada publicação
   para forçar a atualização nos aparelhos. */
const CACHE_VERSION = 'barragem-v1';

/* Caminhos relativos ao escopo do SW (funciona sob /app-barragem/ no GitHub Pages) */
const APP_SHELL = [
  './',
  './index.html',
  './app-update.js',
  './pdf-export.js',
  './vendor/jspdf.umd.min.js',
  './vendor/html2canvas.min.js',
  './manifest.json',
  './logo-barragem.png',
  './icon-barragem-192.png',
  './icon-barragem-512.png',
  './icon-barragem-512-maskable.png',
  './apple-touch-icon-barragem.png'
];

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll falha tudo se um item faltar; usamos add individual tolerante
      .then(cache => Promise.all(APP_SHELL.map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      // Só apaga caches DESTE app (prefixo barragem-). O domínio ctvmundovulca.github.io
      // é compartilhado com outros apps (ex.: /VT-CTV/): nunca apagar o cache deles.
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith('barragem-') && k !== CACHE_VERSION)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Firestore/Auth têm cache próprio (IndexedDB); não interceptar as APIs do Google
  if (/googleapis\.com/.test(req.url)) return;

  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    // network-first com timeout de 3s — sinal fraco serve do cache rápido
    const fromNetwork = fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    });
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 3000));
    const fromCache = () => caches.match(req).then(r => r || caches.match('./index.html'));
    event.respondWith(
      Promise.race([fromNetwork, timeout])
        .then(resp => resp || fromCache())
        .catch(() => fromCache())
    );
    return;
  }

  // cache-first para os demais assets (inclui o SDK do Firebase em gstatic.com)
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    }).catch(() => cached))
  );
});
