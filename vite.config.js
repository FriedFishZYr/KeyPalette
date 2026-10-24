import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  // Served as a GitHub Pages project site at friedfishzyr.github.io/KeyPalette/.
  base: '/KeyPalette/',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Vitest picks up this block. Pure-logic tests run in Node; component tests
  // opt into jsdom with a `// @vitest-environment jsdom` comment at the top.
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',
    restoreMocks: true,
    css: { include: [/\.module\.css$/], modules: { classNameStrategy: 'non-scoped' } },
  },
});
