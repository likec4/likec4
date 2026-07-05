import { defineTokens } from '@pandacss/dev'
import { defaultTheme } from '../defaults'

export const fontTokens = defineTokens({
  fontWeights: {
    normal: {
      value: '400',
    },
    medium: {
      value: '500',
    },
    semibold: {
      value: '600',
    },
    bold: {
      value: '600', // this is on purpose, we use semibold for bold
    },
    extrabold: {
      value: '700',
    },
  },
  fontSizes: {
    'xxs': {
      value: '10px',
    },
    xs: {
      value: '12px',
    },
    sm: {
      value: '14px',
    },
    md: {
      value: '16px',
    },
    lg: {
      value: '18px',
    },
    xl: {
      value: '20px',
    },
    likec4: Object.fromEntries(
      Object.entries(defaultTheme.textSizes).map(([key, value]) => [
        key,
        {
          description: `LikeC4 Diagram Text Size: ${key}`,
          value: `${value}px`,
        },
      ]),
    ),
  },
  lineHeights: {
    '1': {
      value: '1',
    },
    'xxs': {
      value: '1.1',
    },
    xs: {
      value: '1.2',
    },
    sm: {
      value: '1.35',
    },
    md: {
      value: '1.45',
    },
    lg: {
      value: '1.55',
    },
    xl: {
      value: '1.6',
    },
  },
  fonts: {
    mono: {
      value: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
    },
    body: {
      value:
        `'IBM Plex Sans Variable',ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
    },
    likec4: {
      DEFAULT: {
        value: 'var(--likec4-app-font, var(--likec4-app-font-default, {fonts.body}))',
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
  letterSpacings: {
    tighter: { value: '-0.05em' },
    tight: { value: '-0.025em' },
    normal: { value: '0em' },
    wide: { value: '0.025em' },
    wider: { value: '0.05em' },
    widest: { value: '0.1em' },
  },
})
