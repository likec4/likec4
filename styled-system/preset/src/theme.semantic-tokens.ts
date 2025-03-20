import { type Config, defineSemanticTokens } from '@pandacss/dev'

type ExtendableTheme = NonNullable<Config['theme']>

export const semanticTokens = defineSemanticTokens({
  fontSizes: {
    likec4: {
      textSize: {
        description: 'LikeC4 text size',
        value: {
          // base: 'var(--likec4-text-size, {fontSizes.likec4.md})',
          base: '{fontSizes.likec4.md}',
          // [`:where(.likec4-diagram-root) &`]: '{fontSizes.likec4.xl}',
        },
      },
    },
  },
  colors: {
    likec4: {
      mixColor: {
        description: 'Color to be used in color-mix',
        value: {
          base: 'white',
          _light: 'black',
        },
      },
      background: {
        DEFAULT: {
          description: 'Background color',
          value: {
            base: '{colors.mantine.colors.body}',
          },
        },
        pattern: {
          description: 'Background pattern color',
          value: {
            base: '{colors.mantine.colors.dark[5]}',
            _light: '{colors.mantine.colors.gray[4]}',
          },
        },
      },
      //
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
