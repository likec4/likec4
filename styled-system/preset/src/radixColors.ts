import createRadixColorsPreset from 'pandacss-preset-radix-colors'
import { DefaultTagColors } from './defaults'

export const radixColorsPreset = createRadixColorsPreset({
  autoP3: false,
  darkMode: {
    condition: '[data-mantine-color-scheme="dark"] &',
  },
  colorScales: [...DefaultTagColors],
})
