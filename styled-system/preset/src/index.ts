import { type Preset, definePreset } from '@pandacss/dev'
import radixColorsPreset from 'pandacss-preset-radix-colors'
import { conditions } from './conditions'
import { radixColors } from './const'
import { breakpoints, globalCss } from './generated'
import { globalVars } from './globalVars'
import { layerStyles } from './layer-styles'
import { patterns } from './patterns'
import * as recipes from './recipes'
import { semanticTokens } from './semantic-tokens'
import * as slotRecipes from './stot-recipes'
import { textStyles } from './text-styles'
import { tokens } from './tokens'
import { utilities } from './utilities'

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
  keyframes: {
    'indicatorStrokeOpacity': {
      '0%': {
        strokeOpacity: 0.8,
      },
      '100%': {
        strokeOpacity: 0.4,
      },
    },
    'xyedgeAnimated': {
      '0%': {
        strokeDashoffset: 18 * 2 + 10,
      },
      '100%': {
        strokeDashoffset: 10,
      },
    },
  },
  animationStyles: {
    'indicator': {
      value: {
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationName: 'indicatorStrokeOpacity',
      },
    },
    'xyedgeAnimated': {
      value: {
        animationDuration: '800ms',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
        animationFillMode: 'both',
        animationName: 'xyedgeAnimated',
      },
    },
  },
}

export default definePreset({
  name: 'likec4',
  // Whether to use css reset
  // presets: [
  //   PandaPreset as any,
  // ],
  presets: [
    radixColorsPreset({
      autoP3: false,
      darkMode: {
        condition: '[data-mantine-color-scheme="dark"] &',
      },
      colorScales: radixColors,
    }) as unknown as Preset,
  ],
  globalVars,
  globalCss,
  staticCss: {
    extend: {
      themes: ['light', 'dark'],
    },
  },
  conditions,
  patterns,
  utilities,
  theme: {
    extend: theme,
  },
})
