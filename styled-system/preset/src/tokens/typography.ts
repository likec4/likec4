import { defineTokens } from '@pandacss/dev'
import { defaultTheme } from '../defaults'

export const fonts = defineTokens.fonts({
  display: {
    description: 'Headings, big numerals',
    value:
      `'IBM Plex Sans Variable',ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
  },
  mono: {
    description: 'Data labels, codes, eyebrows',
    value: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
  },
  body: {
    description: 'UI / body',
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
})

export const fontSizes = defineTokens.fontSizes({
  'xxs': { value: '10px', description: '10px — table th, eyebrows, micro-labels' },
  xs: { value: '12px', description: '12px — captions, metadata, dense table text' },
  sm: { value: '13px', description: '13px — secondary / labels' },
  md: { value: '14px', description: '14px — DEFAULT body' },
  lg: { value: '16px', description: '16px — emphasized body / lead' },
  xl: { value: '18px', description: '18px — large body / small heading' },
  likec4: Object.fromEntries(
    Object.entries(defaultTheme.textSizes).map(([key, value]) => [
      key,
      {
        description: `LikeC4 Diagram Text Size: ${key}`,
        value: `${value}px`,
      },
    ]),
  ),

  h1: { value: '2.125rem', description: '34px' },
  h2: { value: '1.625rem', description: '26px' },
  h3: { value: '1.375rem', description: '22px' },
  h4: { value: '1.125rem', description: '18px' },
  h5: { value: '1rem', description: '16px' },
  h6: { value: '0.875rem', description: '14px' },
})

export const fontWeights = defineTokens.fontWeights({
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
  display: { value: '700', description: 'big display numerals / hero' },
})

export const lineHeights = defineTokens.lineHeights({
  tight: { value: '1.05', description: 'display' },
  snug: { value: '1.1', description: 'headings' },
  xs: { value: '1.2' },
  sm: { value: '1.35' },
  md: { value: '1.45' },
  lg: { value: '1.5' },
  xl: { value: '1.5' },
  '1': { value: '1', deprecated: 'Use tight instead' },
})

export const letterSpacings = defineTokens.letterSpacings({
  display: { value: '-0.02em', description: 'slightly tight on display / numerals' },
  tight: { value: '-0.025em' },
  normal: { value: '0em' },
  caps: {
    DEFAULT: { value: '0.12em', description: 'mono eyebrows / uppercase labels' },
    sm: { value: '0.06em', description: 'table headers' },
  },
})
