/// <reference types="vite/client" />
/// <reference types="../../src/vite-plugin/modules.d.ts" />

declare const __likec4styles: Map<string, string>
declare const __USE_STYLE_BUNDLE__: boolean
declare const __USE_HASH_HISTORY__: boolean | undefined
declare const __USE_OVERVIEW_GRAPH__: boolean | undefined
declare const __HOT_ENABLED__: boolean
declare const SHADOW_STYLE: string

// default is 'likec4'
declare const WEBCOMPONENT_PREFIX: string

interface ImportMetaEnv {
  readonly VITE_KROKI_D2_SVG_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs' {
  import mermaid from 'mermaid'
  export default mermaid
}
