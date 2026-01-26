import createRadixColorsPreset from 'pandacss-preset-radix-colors'
import { DefaultTagColors } from './defaults/types.ts'

export const radixColorsPreset = /* @__PURE__ */ createRadixColorsPreset({
  autoP3: false,
  darkMode: {
    condition: '[data-mantine-color-scheme="dark"] &',
  },
  colorScales: [...DefaultTagColors],
})
