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
      background: {
        DEFAULT: {
          description: 'Background color',
          value: '{colors.mantine.colors.body}',
        },
        pattern: {
          description: 'Background pattern color',
          value: {
            base: '{colors.mantine.colors.dark[5]}',
            _light: '{colors.mantine.colors.gray[4]}',
          },
        },
      },
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
      panel: {
        bg: {
          DEFAULT: {
            description: 'LikeC4 panel background color',
            value: {
              base: `{colors.mantine.colors.body/90}`,
              _dark: `{colors.mantine.colors.dark[6]/70}`,
            },
          },
          whenPanning: {
            description: 'LikeC4 panel background color when panning',
            value: {
              base: `{colors.mantine.colors.body}`,
              _dark: `{colors.mantine.colors.dark[6]}`,
            },
          },
        },
        border: {
          description: 'LikeC4 panel border color',
          value: {
            base: 'transparent',
            _light: `{colors.mantine.colors.defaultBorder/30}`,
          },
        },
      },
      dropdown: {
        bg: {
          DEFAULT: {
            description: 'LikeC4 dropdown background color',
            value: {
              base: `#FFF`,
              _dark: `{colors.mantine.colors.dark[6]}`,
            },
          },
        },
        border: {
          description: 'LikeC4 dropdown border color',
          value: '{colors.likec4.panel.border}',
        },
      },
    },
  },
})
