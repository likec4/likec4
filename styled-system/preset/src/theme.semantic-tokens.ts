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
      tag: {
        bg: {
          DEFAULT: { value: `{colors.tomato.9}` },
          hover: { value: `{colors.tomato.10}` },
        },
        border: {
          value: `{colors.tomato.8}`,
        },
        text: {
          value: `{colors.tomato.12}`,
        },
      },
      palette: {
        DEFAULT: { value: `var(--likec4-palette,'likec4.primary')` },
        fill: { value: '{colors.likec4.primary.element.fill}' },
        stroke: { value: '{colors.likec4.primary.element.stroke}' },
        hiContrast: { value: '{colors.likec4.primary.element.hiContrast}' },
        loContrast: { value: '{colors.likec4.primary.element.loContrast}' },
        light: { value: '{colors.likec4.primary.element.light}' },
        dark: { value: '{colors.likec4.primary.element.dark}' },
      },
      relation: {
        stroke: {
          light: { value: '{colors.likec4.gray.relation.stroke.light}' },
          dark: { value: '{colors.likec4.gray.relation.stroke.dark}' },
          selected: { 
            light: { value: '{colors.likec4.gray.relation.stroke.selected.light}' },
            dark: { value: '{colors.likec4.gray.relation.stroke.selected.dark}' },
           },
        },
        label: {
          DEFAULT: { value: '{colors.likec4.gray.relation.label}' },
          bg: { value: '{colors.likec4.gray.relation.label.bg}' },
        },
      },
    },
  },
})
