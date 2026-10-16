/// <reference types="@likec4/vite-plugin/modules" />
/// <reference path="../.astro/types.d.ts" />

declare module 'virtual:starlight/user-config' {
  const config: import('@astrojs/starlight/types').StarlightConfig
  export default config
}
