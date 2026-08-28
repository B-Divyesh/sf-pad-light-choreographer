import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static response policy', () => {
  it('keeps hashed assets immutable while protecting the app shell', () => {
    const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as {
      globalHeaders: Record<string, string>;
      routes: Array<{ route: string; headers: Record<string, string> }>;
    };
    const assets = config.routes.find((route) => route.route === '/assets/*');
    const worker = config.routes.find((route) => route.route === '/sw.js');

    expect(assets?.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(worker?.headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('midi=(self)');
  });
});
