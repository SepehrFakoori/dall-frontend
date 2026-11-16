import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['BACKEND_', 'VITE_']);
  const demo = mode === 'demo' || mode === 'test';
  const apiMount = (env.VITE_API_URL || '/api').replace(/\/+$/, '');
  if (!/^\/(?:[\w-]+\/)*[\w-]+$/.test(apiMount))
    throw new Error('VITE_API_URL must be a same-origin path such as /api.');

  const base = env.BACKEND_BASE_URL || (demo ? 'http://localhost:8000' : '');
  if (!base) throw new Error(`Set BACKEND_BASE_URL for the ${mode} environment.`);
  const upstream = new URL(base);
  if (
    !['https:', 'http:'].includes(upstream.protocol) ||
    upstream.username ||
    upstream.password ||
    upstream.search ||
    upstream.hash ||
    !/^\/[\w/%.-]*$/.test(upstream.pathname)
  )
    throw new Error('BACKEND_BASE_URL must be an HTTP(S) origin with an optional path.');
  const target = upstream.href.replace(/\/+$/, '');
  const proxy = {
    [`^${apiMount}/`]: {
      target,
      changeOrigin: true,
      cookieDomainRewrite: '',
      rewrite: (path: string) => path.slice(apiMount.length),
    },
  };
  // Generate the deployed proxy from the same URL and mount used by Vite.
  const location = `location ^~ ${apiMount}/ {
  proxy_pass ${target}/;
  proxy_ssl_server_name on;
  proxy_ssl_verify on;
  proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
  proxy_cookie_domain ~.+ $host;
}
`;
  return {
    plugins: [
      react(),
      {
        name: 'frontend-api-proxy',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'api-location.conf', source: location });
        },
        configurePreviewServer(server) {
          const file = resolve(server.config.root, server.config.build.outDir, 'api-location.conf');
          if (readFileSync(file, 'utf8') !== location)
            throw new Error(
              'Preview API settings differ from the build. Use pnpm preview --mode <build-mode>.',
            );
        },
      },
    ],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiMount),
      'import.meta.env.VITE_API_MODE': JSON.stringify(
        demo ? 'mock' : env.VITE_API_MODE || 'django',
      ),
    },
    server: { proxy },
    preview: { proxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
    },
  };
});
