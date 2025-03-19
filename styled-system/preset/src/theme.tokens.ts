import { defineTokens } from '@pandacss/dev'

export const tokens = defineTokens({
  lineHeights: {
    '1': {
      value: '1',
    },
  },
  borders: {
    none: { value: 'none' },
    transparent: { value: '0px solid transparent' },
    default: { value: '1px solid {colors.mantine.colors.defaultBorder}' },
  },
  spacing: {
    '0': {
      value: '0px',
    },
    '2': {
      value: '2px',
    },
    '4': {
      value: '4px',
    },
    'micro': {
      value: '4px',
    },
    '2xs': {
      value: '8px',
    },
    '8': {
      value: '8px',
    },
  },
  colors: {
    // For typesafety, otherwise wrap with []
    transparent: { value: 'transparent' },
  },
  fonts: {
    body: {
      value: 'var(--likec4-app-font, var(--likec4-app-font-default))',
    },
    likec4: {
      DEFAULT: {
        value: 'var(--likec4-app-font, var(--likec4-app-font-default))',
      },
      element: {
        value: 'var(--likec4-element-font, {fonts.likec4})',
      },
      compound: {
        value: 'var(--likec4-compound-font, {fonts.likec4})',
      },
      relation: {
        value: 'var(--likec4-relation-font, {fonts.likec4})',
      },
    },
  },
  easings: {
    default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
    out: { value: 'cubic-bezier(0, 0, 0.40, 1)' },
    inOut: { value: 'cubic-bezier(0.50, 0, 0.2, 1)' },
  },
  durations: {
    fastest: { value: '50ms' },
    faster: { value: '100ms' },
    fast: { value: '130ms' },
    normal: { value: '170ms' },
    slow: { value: '300ms' },
    slower: { value: '400ms' },
    slowest: { value: '500ms' },
  },
})
