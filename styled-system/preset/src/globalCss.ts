import type { Config } from '@pandacss/dev'
import { globalCss as generated } from './generated'

type ExtendableGlobalCss = NonNullable<Config['globalCss']>

export const globalCss: ExtendableGlobalCss = {
  extend: {
    ...generated,
    // '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
    //   // TODO: this workaround disables animations in Safari (to improve performance)
    //   ['--likec4-safari-animation-hook']: ' ',
    // },
    '.likec4-shadow-root': {
      display: 'contents',
      '--mantine-font-family': 'var(--likec4-app-font, var(--likec4-app-font-default))',
      '--mantine-font-family-headings': 'var(--likec4-app-font, var(--likec4-app-font-default))',
    },
  },
}
