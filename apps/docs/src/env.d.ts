/// <reference types="@likec4/vite-plugin/modules" />
/// <reference path="../.astro/types.d.ts" />

// Starlight exposes the resolved configuration through a virtual Vite module.
// Declare its type for Astro's standalone typecheck (which cannot resolve virtual modules).
declare module 'virtual:starlight/user-config' {
  const config: import('@astrojs/starlight/types').StarlightConfig
  export default config
}
