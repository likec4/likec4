import { defineTokens } from '@pandacss/dev'
import { tokens as generated } from '../generated.ts'
import { radixColors } from './radixColors.ts'

export const colors = defineTokens.colors({
  mantine: generated.colors.mantine,
  // For typesafety, otherwise wrap with []
  transparent: { value: 'transparent' },
  // For fill: none
  none: { value: 'none' },
  inherit: { value: 'inherit' },
  white: {
    value: '#fff',
  },
  black: {
    value: '#000',
  },
  ...radixColors,
})
