import { defineTokens } from '@pandacss/dev'
import { mantine, tokens as generated } from './generated.ts'

export const colors = defineTokens.colors({
  mantine: generated.colors.mantine,
  // For typesafety, otherwise wrap with []
  transparent: { value: 'transparent' },
  // For fill: none
  none: { value: 'none' },
})
