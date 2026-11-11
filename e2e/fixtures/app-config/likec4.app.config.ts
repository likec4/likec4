import { defineAppConfig } from 'likec4/config'

// Used by src/likec4-cli-app-config.spec.ts and tests/app-config-customization.spec.ts
export default defineAppConfig({
  title: 'E2E App Config',
  webcomponentPrefix: 'e2e',
  customization: './likec4.customization.tsx',
  build: {
    outDir: './dist',
  },
})
