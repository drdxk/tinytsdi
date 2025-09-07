import {defineConfig} from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist/types',
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.build.vite-dts.json',
      rollupTypes: true,
    }),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
    },
    rollupOptions: {
      output: [
        {
          format: 'cjs',
          dir: 'dist/cjs',
          entryFileNames: 'index.js',
        },
        {
          format: 'es',
          dir: 'dist/esm',
          entryFileNames: 'index.js',
        },
      ],
    },
  },
});
