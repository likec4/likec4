import { defineTokens } from '@pandacss/dev'
import { tokens as generated } from './generated'

export const tokens = defineTokens({
  ...generated,
  lineHeights: {
    ...generated.lineHeights,
    '1': {
      value: '1',
    },
  },
  sizes: {
    '100%': {
      value: '100%',
    },
    full: {
      value: '100%',
    },
  },
  borders: {
    none: { value: 'none' },
    transparent: { value: '0px solid transparent' },
    default: { value: '1px solid {colors.mantine.colors.defaultBorder}' },
  },
  spacing: {
    ...generated.spacing,
    '0': {
      description: 'Non-scalable spacing value - 0px',
      value: '0px',
    },
    '0.5': {
      description: 'Non-scalable spacing value - (0.5 * 4px)',
      value: '2px',
    },
    '1': {
      description: 'Non-scalable spacing value - (1 * 4px)',
      value: '4px',
    },
    '1.5': {
      description: 'Non-scalable spacing value - (1.5 * 4px)',
      value: '6px',
    },
    '2': {
      description: 'Non-scalable spacing value - (2 * 4px)',
      value: '8px',
    },
    '2.5': {
      description: 'Non-scalable spacing value - (2.5 * 4px)',
      value: '10px',
    },
    '3': {
      description: 'Non-scalable spacing value - (3 * 4px)',
      value: '12px',
    },
    '3.5': {
      description: 'Non-scalable spacing value - (3.5 * 4px)',
      value: '14px',
    },
    '4': {
      description: 'Non-scalable spacing value - (4 * 4px)',
      value: '16px',
    },
    '4.5': {
      description: 'Non-scalable spacing value - (4.5 * 4px)',
      value: '18px',
    },
    '5': {
      description: 'Non-scalable spacing value - (5 * 4px)',
      value: '20px',
    },
    '6': {
      description: 'Non-scalable spacing value - (6 * 4px)',
      value: '24px',
    },
    '7': {
      description: 'Non-scalable spacing value - (7 * 4px)',
      value: '28px',
    },
    '8': {
      description: 'Non-scalable spacing value - (8 * 4px)',
      value: '32px',
    },
    '9': {
      description: 'Non-scalable spacing value - (9 * 4px)',
      value: '36px',
    },
    '10': {
      description: 'Non-scalable spacing value - (10 * 4px)',
      value: '40px',
    },
    xxs: {
      description: 'Scalable spacing value - (0.5rem * var(--scale)) (8px)',
      value: 'calc(0.5rem * var(--mantine-scale))', // 8px
    },
    xs: {
      description: 'Scalable spacing value - (0.625rem * var(--scale)) (10px)',
      value: 'calc(0.625rem * var(--mantine-scale))', // 10px
    },
    sm: {
      description: 'Scalable spacing value - (0.75rem * var(--scale)) (12px)',
      value: 'calc(0.75rem * var(--mantine-scale))', // 12px
    },
    md: {
      description: 'Scalable spacing value - (1rem * var(--scale)) (16px)',
      value: 'calc(1rem * var(--mantine-scale))', // 16px
    },
    lg: {
      description: 'Scalable spacing value - (1.25rem * var(--scale)) (20px)',
      value: 'calc(1.25rem * var(--mantine-scale))', // 20px
    },
    xl: {
      description: 'Scalable spacing value - (2rem * var(--scale)) (32px)',
      value: 'calc(2rem * var(--mantine-scale))', // 32px
    },
  },
  radii: {
    0: {
      value: '0px',
    },
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
    ...generated.colors,
    // For typesafety, otherwise wrap with []
    transparent: { value: 'transparent' },
    // For fill: none
    none: { value: 'none' },
  },
  fontWeights: {
    normal: {
      value: '400',
    },
    medium: {
      value: '500',
    },
  },
  fonts: {
    mono: {
      value: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
    },
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
      value: '0 1px 3px rgb(0 0 0/5%), 0 1px 2px rgb(0 0 0/10%)',
    },
    sm: {
      value: '0 1px 3px rgb(0 0 0/5%), 0 10px 15px -5px rgb(0 0 0/5%), 0 7px 7px -5px rgb(0 0 0/4%)',
    },
    md: {
      value: '0 1px 3px rgb(0 0 0/5%), 0 20px 25px -5px rgb(0 0 0/5%), 0 10px 10px -5px rgb(0 0 0/4%)',
    },
    lg: {
      value: '0 1px 3px rgb(0 0 0/5%), 0 28px 23px -7px rgb(0 0 0/5%), 0 12px 12px -7px rgb(0 0 0/4%)',
    },
    xl: {
      value: '0 1px 3px rgb(0 0 0/5%), 0 36px 28px -7px rgb(0 0 0/5%), 0 17px 17px -7px rgb(0 0 0/4%)',
    },
  },
  zIndex: {
    '-1': {
      value: '-1',
    },
    '0': {
      value: '0',
    },
    '1': {
      value: '1',
    },
    likec4: {
      panel: {
        value: '100',
      },
      dropdown: {
        value: '200',
      },
    },
  },
})
