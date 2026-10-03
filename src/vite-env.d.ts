/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PHOTO_ESTIMATE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
