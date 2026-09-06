import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? '4173');
const dist = resolve('dist');
const appRoutes = new Set(['/', '/practice', '/arrange', '/connect', '/demo', '/demo/arrange', '/demo/connect']);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

function headersFor(pathname) {
  return {
    'Content-Type': contentTypes[extname(pathname)] ?? 'application/octet-stream',
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : pathname === '/sw.js' ? 'no-cache, no-store, must-revalidate' : 'no-cache',
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self'",
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=(), midi=(self)',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
  };
}

async function fileResponse(pathname) {
  const requested = appRoutes.has(pathname)
    ? 'index.html'
    : pathname.endsWith('/')
      ? join(pathname.slice(1), 'index.html')
      : pathname.slice(1);
  const candidate = normalize(join(dist, requested));
  if (!candidate.startsWith(`${dist}/`) && candidate !== dist) throw new Error('Invalid path');
  return { body: await readFile(candidate), file: requested, status: 200 };
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://' + host).pathname;
  try {
    const result = await fileResponse(pathname);
    response.writeHead(result.status, headersFor('/' + result.file));
    response.end(result.body);
  } catch {
    try {
      const body = await readFile(join(dist, '404.html'));
      response.writeHead(404, headersFor('/404.html'));
      response.end(body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    }
  }
});

server.listen(port, host, () => console.log('Serving ' + dist + ' on http://' + host + ':' + port));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
