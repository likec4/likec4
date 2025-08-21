import type { Config } from '@pandacss/dev'
import { iconSize } from './const'
import { paletteGlobalVars } from './generated'

type ExtendableGlobalVars = NonNullable<Config['globalVars']>

export const globalVars: ExtendableGlobalVars = {
  extend: {
    ...paletteGlobalVars,
    '--mantine-scale': '1',
    '--likec4-palette-outline': 'var(--likec4-palette-loContrast)',
    '--likec4-spacing': {
      syntax: '<length> | <percentage>',
      inherits: false,
    },
    '--text-fz': {
      syntax: '<length> | <percentage>',
      inherits: false,
    },
    [iconSize]: {
      syntax: '<length> | <percentage>',
      inherits: false,
    },
  },
}
