import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { configureApi } from './config/api-proxy.ts';

const envDir = fileURLToPath(new URL('./env/', import.meta.url));
const defaultBases: Readonly<Record<string, string | undefined>> = {
  dev: 'http://localhost:8000',
  staging: 'https://staging.dall.ir',
  prod: 'https://api.dall.ir',
};

export default defineConfig(({ mode }) => {
  // Vite's default CLI modes and the existing long build names remain supported.
  const fileMode = mode === 'development' ? 'dev' : mode === 'production' ? 'prod' : mode;
  const demo = mode === 'demo' || mode === 'test';
  const env = loadEnv(fileMode, envDir, ['BACKEND_BASE_URL', 'VITE_API_URL', 'VITE_API_MODE']);
  const base = env.BACKEND_BASE_URL || defaultBases[demo ? 'dev' : fileMode];
  if (!base) throw new Error(`Set BACKEND_BASE_URL for mode ${mode}.`);
  const api = configureApi(base, env.VITE_API_URL || '/api');

  return {
    envDir,
    // Only the two explicitly defined public values below belong in the browser bundle.
    envPrefix: [],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(api.apiMount),
      'import.meta.env.VITE_API_MODE': JSON.stringify(
        demo ? 'mock' : env.VITE_API_MODE || 'django',
      ),
    },
    plugins: [react(), api.plugin],
    server: { proxy: api.proxy },
    preview: { proxy: api.proxy },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
    },
  };
});
