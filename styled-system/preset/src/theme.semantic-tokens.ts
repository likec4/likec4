import { type Config, defineSemanticTokens } from '@pandacss/dev'

type ExtendableTheme = NonNullable<Config['theme']>

export const semanticTokens = defineSemanticTokens({
  fontSizes: {
    likec4: {
      textSize: {
        description: 'LikeC4 text size',
        value: '{fontSizes.likec4.md}',
      },
    },
  },
  colors: {
    likec4: {
      mixColor: {
        description: 'Color to be used in color-mix',
        value: {
          _dark: 'white',
          _light: 'black',
        },
      },
      palette: {
        DEFAULT: { value: `var(--likec4-palette,'likec4.primary')` },
        fill: { value: '{colors.likec4.primary.element.fill}' },
        stroke: { value: '{colors.likec4.primary.element.stroke}' },
        hiContrast: { value: '{colors.likec4.primary.element.hiContrast}' },
        loContrast: { value: '{colors.likec4.primary.element.loContrast}' },
      },
      relation: {
        stroke: {
          DEFAULT: { value: '{colors.likec4.gray.relation.stroke}' },
          selected: { value: '{colors.likec4.gray.relation.stroke.selected}' },
        },
        label: {
          DEFAULT: { value: '{colors.likec4.gray.relation.label}' },
          bg: { value: '{colors.likec4.gray.relation.label.bg}' },
        },
      },
    },
  },
})
