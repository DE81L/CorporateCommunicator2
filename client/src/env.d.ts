/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_STUN_SERVER?: string;
    // add other VITE_... vars here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
