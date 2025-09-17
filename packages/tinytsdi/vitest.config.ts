import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],

    environment: 'node',

    globals: true,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },

  esbuild: {
    target: 'node22',
  },
});
