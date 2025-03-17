import type { Config } from '@pandacss/dev'
import { theme as generated } from './generated'
import { actionBtn } from './recipes'
import { semanticTokens } from './theme.semantic-tokens'
import { textStyles } from './theme.text-styles'

type ExtendableTheme = NonNullable<Config['theme']>

export const theme: ExtendableTheme = {
  ...generated,
  extend: {
    textStyles,
    recipes: {
      actionBtn,
    },

    tokens: {
      lineHeights: {
        '1': {
          value: '1',
        },
      },
      borders: {
        'transparent': {
          value: '0px solid transparent',
        },
        'default_0px': {
          value: '0px solid {colors.mantine.colors.defaultBorder}',
        },
      },
      colors: {
        // For typesafety, otherwise wrap with []
        'transparent': {
          value: 'transparent',
        },
      },
    },

    semanticTokens,

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
          _notReducedGraphics: {
            animationDuration: '1s',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationName: 'indicatorStrokeOpacity',
          },
        },
      },
    },
  },
}
