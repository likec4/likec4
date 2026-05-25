import { type Config, defineConfig as pandaDefineConfig, definePreset } from '@pandacss/dev'

import { animationStyles, keyframes } from './animations.ts'
import { conditions } from './conditions.ts'
import { vars as likec4vars } from './defaults/vars.ts'
import { breakpoints, mantine } from './generated.ts'
import { globalCss } from './globalCss.ts'
import { globalVars } from './globalVars.ts'
import { layerStyles } from './layer-styles.ts'
import { patterns } from './pattens/index.ts'
import { recipes } from './recipes/index.ts'
import * as slotRecipes from './stot-recipes/index.ts'
import { textStyles } from './text-styles.ts'
import { semanticTokens } from './tokens-semantic/index.ts'
import { tokens } from './tokens/index.ts'
import { utilities } from './utilities.ts'

export const theme = {
  breakpoints,
  textStyles,
  layerStyles,
  tokens,
  semanticTokens,
  recipes,
  slotRecipes,
  containerNames: ['likec4-root', 'likec4-dialog'],
  containerSizes: {
    xs: '384px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
  },
  keyframes,
  animationStyles,
}

export const likec4preset = /* @__PURE__ */ definePreset({
  name: 'likec4',
  globalVars,
  globalCss: {
    extend: globalCss,
  },
  conditions,
  patterns,
  utilities,
  theme: {
    extend: theme,
  },
})

export default likec4preset

export const vars = {
  likec4: likec4vars,
  mantine,
}
