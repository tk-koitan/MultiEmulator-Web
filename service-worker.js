'use strict';
const VERSION = '30f3a0f8cb1dbd1f8328';
const PREFIX = 'multiemulator-pwa:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const FILES = ["index.html", "manifest.webmanifest", "pwa.js", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "Build/WebBuild.data", "Build/WebBuild.framework.js", "Build/WebBuild.loader.js", "Build/WebBuild.wasm"];
const URLS = FILES.map(file => new URL(file, self.registration.scope).href);
const ASSETS = new Map(URLS.map(url => [new URL(url).pathname, url]));
const ROOT = new URL('./', self.registration.scope);

self.addEventListener('install', event => {
  // A complete, matching player is cached before activation. Failed updates keep
  // the previous player. Existing games finish before a new worker activates.
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(URLS.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin) return;
  let asset = ASSETS.get(url.pathname);
  if (request.mode === 'navigate' && url.pathname === ROOT.pathname) {
    asset = new URL('index.html', ROOT).href;
  }
  if (!asset) return; // ROMs and online communication are outside this cache.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE), cached = await cache.match(asset);
    if (cached) return cached;
    // Recover an individually removed entry without ever caching external URLs.
    const response = await fetch(request);
    if (response.ok) await cache.put(asset, response.clone());
    return response;
  })());
});
