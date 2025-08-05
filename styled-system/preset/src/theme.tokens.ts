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
    DEFAULT: {
      value: '4px', // 4px
    },
    '0': {
      value: '0px',
    },
    '0.5': {
      value: '2px', // spacing * <value>
    },
    '1': {
      value: '4px',
    },
    '1.5': {
      value: '6px', // spacing * <value>
    },
    '2': {
      value: '8px',
    },
    '2.5': {
      value: '10px', // spacing * <value>
    },
    '3': {
      value: '12px',
    },
    '3.5': {
      value: '14px',
    },
    '4': {
      value: '16px',
    },
    '4.5': {
      value: '18px',
    },
    '5': {
      value: '20px',
    },
    '6': {
      value: '24px',
    },
    '7': {
      value: '28px',
    },
    '8': {
      value: '32px',
    },
    '9': {
      value: '36px',
    },
    '10': {
      value: '40px',
    },
    xxs: {
      value: 'calc(0.5rem * var(--mantine-scale))', // 8px
    },
    xs: {
      value: 'calc(0.625rem * var(--mantine-scale))', // 10px
    },
    sm: {
      value: 'calc(0.75rem * var(--mantine-scale))', // 12px
    },
    md: {
      value: 'calc(1rem * var(--mantine-scale))', // 16px
    },
    lg: {
      value: 'calc(1.25rem * var(--mantine-scale))', // 20px
    },
    xl: {
      value: 'calc(2rem * var(--mantine-scale))', // 32px
    },
  },
  radii: {
    xs: {
      value: '0.125rem',
    },
    sm: {
      value: '0.25rem',
    },
    md: {
      value: '0.5rem',
    },
    lg: {
      value: '1rem',
    },
    xl: {
      value: '2rem',
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
  shadows: {
    none: { value: 'none' },
    xs: {
      value: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    },
    sm: {
      value: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 10px 15px -5px, rgba(0, 0, 0, 0.04) 0 7px 7px -5px',
    },
    md: {
      value:
        '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 20px 25px -5px, rgba(0, 0, 0, 0.04) 0 10px 10px -5px',
    },
    lg: {
      value:
        '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 28px 23px -7px, rgba(0, 0, 0, 0.04) 0 12px 12px -7px',
    },
    xl: {
      value:
        '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 36px 28px -7px, rgba(0, 0, 0, 0.04) 0 17px 17px -7px',
    },
  },
})
