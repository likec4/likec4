import { defineSemanticTokens } from '@pandacss/dev'
import { mantine } from './generated'
import { mixTransparent } from './helpers'

export const semanticTokens = defineSemanticTokens({
  colors: {
    text: {
      DEFAULT: {
        description: 'Default text color',
        value: mantine.colors.text,
      },
      dimmed: {
        description: 'Dimmed text color',
        value: mantine.colors.dimmed,
      },
    },
    likec4: {
      background: {
        DEFAULT: {
          description: 'Background color',
          value: mantine.colors.body,
        },
        pattern: {
          description: 'Background pattern color',
          value: {
            _dark: mixTransparent(mantine.colors.dark[4], 70),
            _light: mantine.colors.gray[4],
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
              base: mantine.colors.body,
              _dark: mantine.colors.dark[6],
            },
          },
        },
        border: {
          description: 'LikeC4 panel border color',
          value: {
            base: 'transparent',
            _light: mantine.colors.gray[2],
          },
        },
        text: {
          DEFAULT: {
            description: 'LikeC4 panel text color',
            value: mixTransparent(mantine.colors.text, 85),
          },
          dimmed: {
            description: 'LikeC4 panel dimmed text color',
            value: mantine.colors.dimmed,
          },
        },
        action: {
          DEFAULT: {
            description: 'LikeC4 panel action text color (Links/Icons)',
            value: mixTransparent(mantine.colors.text, 90),
          },
          disabled: {
            description: 'LikeC4 action icon text color when disabled',
            value: mantine.colors.dimmed,
          },
          hover: {
            description: 'LikeC4 panel action text color on hover',
            value: 'var(--mantine-color-bright)',
          },
          bg: {
            DEFAULT: {
              description: 'LikeC4 action icon background color',
              value: {
                base: mantine.colors.gray[1],
                _dark: mixTransparent(mantine.colors.dark[7], 70),
              },
            },
            hover: {
              description: 'LikeC4 action icon background color on hover',
              value: {
                base: mantine.colors.gray[2],
                _dark: mantine.colors.dark[8],
              },
            },
          },
          warning: {
            DEFAULT: {
              description: 'LikeC4 action icon text color',
              value: mantine.colors.orange[6],
            },
            hover: {
              description: 'LikeC4 action icon text color on hover',
              value: {
                base: mantine.colors.orange[7],
                _dark: mantine.colors.orange[5],
              },
            },
            bg: {
              DEFAULT: {
                description: 'LikeC4 action icon background color',
                value: {
                  base: mixTransparent(mantine.colors.orange[1], 90),
                  _dark: mixTransparent(mantine.colors.orange[9], 10),
                },
              },
              hover: {
                description: 'LikeC4 action icon background color on hover',
                value: {
                  base: mixTransparent(mantine.colors.orange[3], 70),
                  _dark: mixTransparent(mantine.colors.orange[9], 20),
                },
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
              _dark: mantine.colors.dark[6],
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
            value: {
              base: mantine.colors.body,
              _dark: mantine.colors.dark[6],
            },
          },
        },
        border: {
          description: 'LikeC4 overlay border color',
          value: mixTransparent(mantine.colors.defaultBorder, 50),
        },
      },
      compare: {
        manual: {
          DEFAULT: {
            description: 'LikeC4 Compare color for manual changes',
            value: {
              _light: mantine.colors.orange[8],
              _dark: mantine.colors.orange[6],
            },
          },
          outline: {
            value: {
              _light: mantine.colors.orange[8],
              _dark: mixTransparent(mantine.colors.orange[6], 80),
            },
          },
        },
        latest: {
          description: 'LikeC4 Compare color for latest changes',
          value: mantine.colors.green[6],
        },
      },
    },
  },
})
