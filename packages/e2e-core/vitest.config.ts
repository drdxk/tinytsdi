import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],

    environment: 'node',

    globals: true,
  },

  esbuild: {
    target: 'node22',
  },
});
