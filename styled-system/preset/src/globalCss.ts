import type { Config } from '@pandacss/dev'
import { generatedGlobalCss } from './generated'

type ExtendableGlobalCss = NonNullable<Config['globalCss']>

export const globalCss: ExtendableGlobalCss = {
  extend: {
    '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
      // TODO: this workaround disables animations in Safari (to improve performance)
      ['--likec4-safari-animation-hook']: ' ',
    },
    ':where(:root, :host)': {
      ['--likec4-app-font-default']:
        `'IBM Plex Sans','ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'`,
    },
    '.likec4-shadow-root': {
      display: 'contents',
      '--mantine-font-family': 'var(--likec4-app-font, var(--likec4-app-font-default))',
      '--mantine-font-family-headings': 'var(--likec4-app-font, var(--likec4-app-font-default))',
    },
    ...generatedGlobalCss,
  },
}
