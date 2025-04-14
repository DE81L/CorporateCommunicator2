import { Plugin } from 'vite';

declare module "../vite.config.mjs" {
  interface ViteConfig {
    plugins: Plugin[];
    base: string;
    define: { [key: string]: any };
    resolve: { alias: { [key: string]: string } };
    root: string;
    build: {
      outDir: string;
      assetsDir: string;
      emptyOutDir: boolean;
    };
    server: {
      port: number;
      strictPort: boolean;
      proxy: {
        [key: string]: {
          target: string;
          changeOrigin: boolean;
        };
      };
    };
    publicDir: string;
  }

  const config: (arg: { mode: string }) => ViteConfig;
  export default config;
}