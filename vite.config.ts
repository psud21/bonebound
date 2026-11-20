/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    // About half the bundle is inline SVG icon paths (src/ui/icons.generated.ts),
    // which gzip well (~200 kB total). Raise the warning limit rather than split the app.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
