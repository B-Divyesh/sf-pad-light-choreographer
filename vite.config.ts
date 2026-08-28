import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

const CACHE_VERSION = 'plc-v1.1.0';

function serviceWorker(): Plugin {
  return {
    name: 'pad-light-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const builtAssets = Object.values(bundle)
        .map((output) => output.fileName)
        .filter((fileName) => fileName.startsWith('assets/') && /\.(?:js|css)$/.test(fileName))
        .map((fileName) => `/${fileName}`);
      const appShell = [
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/assets/icon.svg',
        '/assets/icon-192.png',
        '/assets/icon-512.png',
        '/assets/icon-maskable-512.png',
        '/assets/pad-cue-hero-480.webp',
        '/assets/pad-cue-hero-800.webp',
        '/assets/pad-cue-hero.webp',
        '/offline.html',
        '/privacy/',
        '/terms/',
        ...builtAssets,
      ];

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const VERSION = '${CACHE_VERSION}';
const SHELL = \`${CACHE_VERSION}-shell\`;
const RUNTIME = \`${CACHE_VERSION}-runtime\`;
const APP_SHELL = ${JSON.stringify(appShell, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => (await caches.match(event.request, { ignoreVary: true })) || (await caches.match('/index.html', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(RUNTIME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [serviceWorker()],
  build: { target: 'es2022', sourcemap: false },
  test: { include: ['tests/**/*.test.ts'] },
});
