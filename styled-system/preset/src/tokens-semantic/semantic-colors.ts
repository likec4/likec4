import { defineSemanticTokens } from '@pandacss/dev'
import { mantine } from '../generated.ts'
import { alpha } from '../helpers.ts'
import { radixColors } from './semantic-colors.radix.ts'
import { subflow } from './semantic-colors.subflow.ts'

export const colors = defineSemanticTokens.colors({
  text: {
    DEFAULT: {
      description: 'Default text color',
      value: mantine.colors.text,
    },
    bright: {
      description: 'Bright text color',
      value: 'var(--mantine-color-bright)',
    },
    dimmed: {
      description: 'Dimmed text color',
      value: mantine.colors.dimmed,
    },
    placeholder: {
      description: 'Placeholder text color',
      value: mantine.colors.placeholder,
    },
  },
  default: {
    DEFAULT: {
      description: 'Default color',
      value: mantine.colors.default,
    },
    color: {
      description: 'Default text color',
      value: mantine.colors.defaultColor,
    },
    border: {
      description: 'Default border color',
      value: mantine.colors.defaultBorder,
    },
    hover: {
      description: 'Default hover color',
      value: mantine.colors.defaultHover,
    },
  },
  disabled: {
    text: {
      description: 'Disabled text color',
      value: mantine.colors.disabledText,
    },
    border: {
      description: 'Disabled border color',
      value: mantine.colors.disabledBorder,
    },
    body: {
      description: 'Disabled body color',
      value: mantine.colors.disabledBody,
    },
  },

  surface: {
    canvas: {
      description: 'Canvas surface color (Diagram background)',
      value: {
        base: mantine.colors.body,
        _dark: mantine.colors.dark[7],
      },
    },
    default: {
      DEFAULT: {
        description: 'Default surface color (ui/panels/cards)',
        value: {
          base: mantine.colors.body,
          _dark: mantine.colors.dark[6],
        },
      },
      border: {
        description: 'LikeC4 overlay border color',
        value: alpha(mantine.colors.defaultBorder, 50),
      },
    },
    sunken: {
      DEFAULT: {
        description: '',
        value: {
          base: mantine.colors.gray[0],
          _dark: alpha(mantine.colors.dark[8], 65),
        },
      },
      border: {
        value: alpha(mantine.colors.defaultBorder, 70),
      },
      hover: {
        value: {
          base: mantine.colors.gray[1],
          _dark: alpha(mantine.colors.dark[8], 80),
        },
      },
    },
  },

  body: {
    description: 'Use {colors.surface.default} instead',
    deprecated: true,
    value: '{colors.surface.canvas}',
  },

  diagram: {
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
        value: `{colors.tomato.3}`,
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
    walkthrough: {
      parallelFrame: {
        description: 'LikeC4 walkthrough parallel frame color',
        value: {
          _light: mantine.colors.orange[8],
          _dark: mantine.colors.orange[6],
        },
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
  subflow,
  ...radixColors,
})
