import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** The development server, preview server, and Nginx use the same mount and upstream path. */
export function configureApi(base: string, mount = '/api') {
  const apiMount = mount.replace(/\/+$/, '');
  if (!/^\/(?:[\w-]+\/)*[\w-]+$/.test(apiMount))
    throw new Error('VITE_API_URL must be a same-origin path such as /api.');

  const url = new URL(base);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !/^(?:[a-z\d.-]+|\[[a-f\d:]+\])$/i.test(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/[\w/%.-]*$/.test(url.pathname)
  )
    throw new Error('BACKEND_BASE_URL must be an HTTP(S) origin with an optional path.');
  const target = url.href.replace(/\/+$/, '');
  const proxy = {
    [`^${apiMount}/`]: {
      target,
      changeOrigin: true,
      cookieDomainRewrite: '',
      rewrite: (path: string) => path.slice(apiMount.length),
    },
  };
  const location = `location ^~ ${apiMount}/ {
  proxy_pass ${target}/;
  proxy_ssl_server_name on;
  proxy_ssl_verify on;
  proxy_ssl_verify_depth 4;
  proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
  proxy_cookie_domain ~.+ $host;
}
`;
  const plugin: Plugin = {
    name: 'frontend-api-proxy',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'api-location.conf', source: location });
    },
    configurePreviewServer(server) {
      const file = resolve(server.config.root, server.config.build.outDir, 'api-location.conf');
      if (readFileSync(file, 'utf8').replaceAll('\r\n', '\n') !== location)
        throw new Error(
          'Preview API settings differ from the build. Use pnpm preview --mode <build-mode>.',
        );
    },
  };
  return { apiMount, proxy, plugin };
}
