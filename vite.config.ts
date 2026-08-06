import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // api/_lib holds the pure server-side logic worth testing. Nothing outside
    // _lib is included, because Vercel treats every other file under api/ as a
    // deployable function and would try to serve a test file as an endpoint.
    include: ['src/**/*.test.{ts,tsx}', 'api/_lib/**/*.test.ts'],
    // Undo spies and stubs between tests so one test's fake clipboard or fake
    // clock can't silently change the outcome of the next.
    restoreMocks: true,
    unstubGlobals: true,
    env: {
      // A deliberately non-UTC zone. Several formatters exist specifically to
      // stop YouTube's UTC timestamps from shifting a day when rendered locally;
      // under TZ=UTC those tests would pass without proving anything.
      TZ: 'America/Denver',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}', 'api/_lib/**/*.ts'],
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/api/types.ts',
        'src/vite-env.d.ts',
      ],
    },
  },
});
