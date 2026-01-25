import { defineSemanticTokens } from '@pandacss/dev'
import { mantine } from './generated.ts'
import { alpha } from './helpers.ts'

export const colors = defineSemanticTokens.colors({
  likec4: {
    background: {
      DEFAULT: {
        description: 'Background color',
        value: mantine.colors.body,
      },
      pattern: {
        description: 'Background pattern color',
        value: {
          base: mantine.colors.gray[4],
          _dark: alpha(mantine.colors.dark[4], 70),
        },
      },
    },
    mixColor: {
      description: 'Color to be used in color-mix',
      value: {
        base: '#000',
        _dark: '#fff',
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
          value: alpha(mantine.colors.text, 85),
        },
        dimmed: {
          description: 'LikeC4 panel dimmed text color',
          value: '{colors.text.dimmed}',
        },
      },
      action: {
        DEFAULT: {
          description: 'LikeC4 panel action text color (Links/Icons)',
          value: alpha(mantine.colors.text, 90),
        },
        disabled: {
          description: 'LikeC4 action icon text color when disabled',
          value: '{colors.text.dimmed}',
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
              _dark: alpha(mantine.colors.dark[7], 70),
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
                base: alpha(mantine.colors.orange[1], 90),
                _dark: alpha(mantine.colors.orange[9], 10),
              },
            },
            hover: {
              description: 'LikeC4 action icon background color on hover',
              value: {
                base: alpha(mantine.colors.orange[3], 70),
                _dark: alpha(mantine.colors.orange[9], 20),
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
            base: `rgb(15 15 15)`,
            _dark: `rgb(34 34 34)`,
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
        value: alpha(mantine.colors.defaultBorder, 50),
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
          description: 'LikeC4 Compare color for outline around nodes with manual changes',
          value: {
            _light: mantine.colors.orange[8],
            _dark: alpha(mantine.colors.orange[6], 80),
          },
        },
      },
      latest: {
        description: 'LikeC4 Compare color for latest changes',
        value: mantine.colors.green[6],
      },
    },
  },
})
