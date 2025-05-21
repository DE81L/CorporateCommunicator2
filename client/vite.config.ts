import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [tsconfigPaths(), react()],
    define: {
      global: 'globalThis',
      'process.env': {}, // обнуляем process.env.*
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL),
    },
    resolve: {
      alias: {
        buffer: 'buffer', // node polyfill
        process: 'process/browser',
        // используем полифилл из node-polyfills для util
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      },
    },
    optimizeDeps: {
      include: ['buffer', 'process', 'util'],
      esbuildOptions: {
        plugins: [
          NodeGlobalsPolyfillPlugin({ process: true, buffer: true }),
          NodeModulesPolyfillPlugin(), // добавляем полифилл модулей
        ],
      },
    },
    build: {
      rollupOptions: {
        plugins: [
          nodePolyfills(), // полифилл Node-пакетов при сборке
        ],
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:4000', // теперь проксируем на 4000
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:4000', // проксируем WS на 4000
          ws: true,
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
