// uno.config.ts
import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno({
      preflight: false
    }),
    presetAttributify({
      prefix: 'uno:'
    })
  ]
})
