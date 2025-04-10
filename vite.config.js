import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

export default defineConfig(({ mode }) => {
  if (mode === 'electron') {
    return {
      build: {
        rollupOptions: {
          external: ['electron'],
        },
        outDir: 'dist-electron',
        minify: false,
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./', import.meta.url)),
          '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
        },
      },
      plugins: [],
    };
  } else {
    return {
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./client', import.meta.url)),
          '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
        },
      },
      build: {
        outDir: 'dist/public',
      },
      plugins: [],
    };
  }
});