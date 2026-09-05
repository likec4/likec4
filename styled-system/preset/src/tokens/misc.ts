import { defineTokens } from '@pandacss/dev'

export const borderWidths = defineTokens.borderWidths({
  '0': { value: '0px' },
  default: { value: '1px', description: 'hairline — resolves to 1px' },
  strong: { value: '2px', description: 'selected emphasis' },
  extra: { value: '3px', description: 'extra strong emphasis' },
  '1': { value: '1px', deprecated: 'Use borderWidths.default instead' },
  '2': { value: '2px', deprecated: 'Use borderWidths.strong instead' },
  '3': { value: '3px', deprecated: 'Use borderWidths.extra instead' },
  '4': { value: '4px', deprecated: 'Use borderWidths.extra instead' },
})
export const borders = defineTokens.borders({
  none: { value: 'none' },
  transparent: { value: '0px solid transparent' },
  subtle: { value: '{borderWidths.default} solid {colors.border.subtle}' },
  default: { value: '{borderWidths.default} solid {colors.border.default}' },
  strong: { value: '{borderWidths.strong} solid {colors.border.strong}' },
})

export const zIndex = defineTokens.zIndex({
  '-1': { value: -1 },
  '0': { value: 0, deprecated: 'Use zIndex.base instead' },
  base: { value: 0 },
  sticky: { value: 100, description: 'sticky headers, nav rail' },
  dropdown: { value: 1000, description: 'menus, popovers, selects' },
  overlay: { value: 2000, description: 'modals, drawers (+ their scrim)' },
  tooltip: { value: 3000 },
  toast: { value: 4000, description: 'transient toasts, top of stack' },

  diagram: {
    edge: {
      DEFAULT: { value: 20 },
      label: { value: 25 },
      controlPoint: { value: 30 },
    },
    node: {
      compound: { value: 10 },
      element: { value: 40 },
    },
  },
})

export const opacity = defineTokens.opacity({
  '0': { value: 0 },
  '0.5': { value: 0.5 },
  '0.7': { value: 0.75 },
  '0.9': { value: 0.9 },
  '1': { value: 1 },
  disabled: { value: 0.6 },
})

export const cursor = defineTokens.cursor({
  default: { value: 'default' },
  pointer: { value: 'pointer' },
  none: { value: 'none' },
  inherit: { value: 'inherit' },
})

export const blurs = defineTokens.blurs({
  subtle: { value: '0.5px' },
  default: { value: '1px' },
  strong: { value: '2px' },
  extra: { value: '4px' },
})
