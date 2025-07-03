import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    
    environment: 'node',
    
    globals: true,
    
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  
  esbuild: {
    target: 'node22'
  }
});