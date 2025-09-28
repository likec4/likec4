import { defineSemanticTokens } from '@pandacss/dev'

export const semanticTokens = defineSemanticTokens({
  colors: {
    likec4: {
      background: {
        DEFAULT: {
          description: 'Background color',
          value: 'var(--mantine-color-body)',
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
              value: 'color-mix(in srgb, var(--mantine-color-text) 80%, transparent)',
            },
            hover: {
              description: 'LikeC4 action icon text color on hover',
              value: 'var(--mantine-color-bright)',
            },
            disabled: {
              description: 'LikeC4 action icon text color when disabled',
              value: 'var(--mantine-color-dimmed)',
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
      overlay: {
        backdrop: {
          DEFAULT: {
            description: 'LikeC4 overlay backdrop color',
            value: {
              base: `rgb(34 34 34)`,
              _light: `rgb(15 15 15)`,
            },
          },
        },
        body: {
          DEFAULT: {
            description: 'LikeC4 overlay body color',
            value: `var(--mantine-color-body)`,
          },
        },
        border: {
          description: 'LikeC4 overlay border color',
          value: '{colors.mantine.colors.defaultBorder/50}',
        },
      },
    },
  },
})
