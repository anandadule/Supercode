import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['app/**/*.test.ts', 'app/**/*.test.tsx'],
    // Unit tests only — E2E / Playwright tests should live elsewhere.
    exclude: ['node_modules/**', 'build/**', '.cache/**'],
  },
});
