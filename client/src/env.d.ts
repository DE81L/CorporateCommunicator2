/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_STUN_SERVER?: string;
    // добавляйте сюда другие переменные VITE_... по необходимости
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
