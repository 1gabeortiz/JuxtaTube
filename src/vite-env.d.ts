/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public OAuth client ID. Safe to ship to the browser — Google's consent
   * screen and the registered origin list are what actually protect it.
   */
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
