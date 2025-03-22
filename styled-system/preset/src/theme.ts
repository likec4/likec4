import type { Config } from '@pandacss/dev'
import { theme as generated } from './generated'
import { actionBtn } from './recipes'
import { semanticTokens } from './theme.semantic-tokens'
import { textStyles } from './theme.text-styles'
import { tokens } from './theme.tokens'

type ExtendableTheme = NonNullable<Config['theme']>

export const theme: ExtendableTheme = {
  ...generated,
  extend: {
    textStyles,
    tokens,
    semanticTokens,
    recipes: {
      actionBtn,
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
  },
}
