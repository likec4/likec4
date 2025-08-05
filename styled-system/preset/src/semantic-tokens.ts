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
            _dark: '{colors.mantine.colors.dark[4]/70}',
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
      panel: {
        bg: {
          DEFAULT: {
            description: 'LikeC4 panel background color',
            value: {
              base: `{colors.mantine.colors.body/90}`,
              _dark: `{colors.mantine.colors.dark[6]/80}`,
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
        'action-icon': {
          text: {
            DEFAULT: {
              description: 'LikeC4 action icon text color',
              value: '{colors.mantine.colors.text/70}',
            },
            hover: {
              description: 'LikeC4 action icon text color on hover',
              value: '{colors.mantine.colors.text}',
            },
            disabled: {
              description: 'LikeC4 action icon text color when disabled',
              value: '{colors.mantine.colors.dimmed}',
            },
          },
          bg: {
            DEFAULT: {
              description: 'LikeC4 action icon background color',
              value: {
                base: '{colors.mantine.colors.gray[1]}',
                _dark: '{colors.mantine.colors.dark[7]/70}',
              },
            },
            hover: {
              description: 'LikeC4 action icon background color on hover',
              value: {
                base: '{colors.mantine.colors.gray[2]}',
                _dark: '{colors.mantine.colors.dark[8]}',
              },
            },
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
