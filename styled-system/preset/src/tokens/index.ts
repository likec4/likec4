import { defineTokens } from '@pandacss/dev'
import { colors } from './colors.ts'
import { fontTokens } from './font.ts'
import { sizes } from './sizes.ts'
import { spacing } from './spacing.ts'

export const tokens = defineTokens({
  ...fontTokens,
  sizes,
  borders: {
    none: { value: 'none' },
    transparent: { value: '0px solid transparent' },
    default: { value: `1px solid {colors.default.border}` },
  },
  borderWidths: {
    '0': {
      value: '0px',
    },
    '1': {
      value: '1px',
    },
    '2': {
      value: '2px',
    },
    '3': {
      value: '3px',
    },
    '4': {
      value: '4px',
    },
  },
  spacing,
  radii: {
    '0': {
      value: '0px',
    },
    xs: {
      value: '2px',
    },
    sm: {
      value: '4px',
    },
    md: {
      value: '8px',
    },
    lg: {
      value: '16px',
    },
    xl: {
      value: '32px',
    },
    pill: {
      value: '999px',
    },
  },
  colors,

  easings: {
    default: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    in: { value: 'cubic-bezier(0.4, 0, 1, 1)' },
    out: { value: 'cubic-bezier(0, 0, 0.40, 1)' },
    inOut: { value: 'cubic-bezier(0.50, 0, 0.2, 1)' },
  },
  durations: {
    '0': { value: '0s' },
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
      diagram: {
        edge: {
          DEFAULT: {
            value: '20',
          },
          label: {
            value: '25',
          },
          controlPoint: {
            value: '30',
          },
        },
        node: {
          compound: {
            value: '10',
          },
          element: {
            value: '40',
          },
        },
      },
      dropdown: {
        value: '200',
      },
      panel: {
        DEFAULT: {
          value: '100',
        },
        dropdown: {
          value: '200',
        },
      },
      floatingWindow: {
        value: '300',
      },
    },
  },
  opacity: {
    '0': {
      value: '0',
    },
    '0.5': {
      value: '0.5',
    },
    '0.7': {
      value: '0.75',
    },
    '0.9': {
      value: '0.9',
    },
    '1': {
      value: '1',
    },
  },
  cursor: {
    default: {
      value: 'default',
    },
    pointer: {
      value: 'pointer',
    },
    none: {
      value: 'none',
    },
  },
  blurs: {
    '.5': {
      value: '0.5px',
    },
    '1': {
      value: '1px',
    },
    '2': {
      value: '2px',
    },
    '4': {
      value: '4px',
    },
  },
})
