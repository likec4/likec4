import { defineTokens } from '@pandacss/dev'

export const radii = defineTokens.radii({
  '0': { value: '0px' },
  xs: { value: '2px', description: '2px — RESTRICTED: tags/thumbnails only, NEVER controls' },
  sm: { value: '4px', description: '4px — controls: buttons, inputs, badges (default)' },
  md: { value: '8px', description: '8px — cards, panels, dropdowns' },
  lg: { value: '16px', description: '16px — modals, drawers, large surfaces' },
  xl: { value: '24px', description: '24px — hero/marketing only, never app chrome' },
  pill: { value: '999px' },
})
