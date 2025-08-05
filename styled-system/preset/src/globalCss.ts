import type { Config } from '@pandacss/dev'
import { nodeOrEdge, root, rootNotReduced } from './const'
import { globalCss as generated } from './generated'

type ExtendableGlobalCss = NonNullable<Config['globalCss']>

export const globalCss: ExtendableGlobalCss = {
  extend: {
    // '@supports ((hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none))': {
    //   // TODO: this workaround disables animations in Safari (to improve performance)
    //   ['--likec4-safari-animation-hook']: ' ',
    // },
    ':where(:host, :root)': {
      ['--likec4-app-font-default']:
        `'IBM Plex Sans','ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'`,
    },
    ...generated,
  },
}
