import { defineSemanticTokens } from '@pandacss/dev'
import { mantine } from '../generated.ts'
import { alpha } from '../helpers.ts'
import { black, dark, gray, green, orange, value, white } from './value.ts'

export const { likec4 } = defineSemanticTokens.colors({
  likec4: {
    mixColor: value({
      description: 'Color to be used in color-mix',
      value: black,
      dark: white,
    }),

    tag: {
      bg: {
        DEFAULT: value(`{colors.tomato.9}`),
        hover: value(`{colors.tomato.10}`),
      },
      border: value(`{colors.tomato.8}`),
      text: value(`{colors.tomato.3}`),
    },

    panel: {
      bg: {
        DEFAULT: value({
          description: 'LikeC4 panel background color',
          value: '{colors.surface.default}',
          dark: dark[6],
        }),
      },
      border: value({
        description: 'LikeC4 panel border color',
        value: gray[2],
        dark: 'transparent',
      }),
      text: {
        DEFAULT: value({
          description: 'LikeC4 panel text color',
          value: '{colors.text.default/85}',
        }),
        dimmed: value({
          description: 'LikeC4 panel dimmed text color',
          value: '{colors.text.dimmed}',
        }),
      },
      action: {
        DEFAULT: value({
          description: 'LikeC4 panel action text color (Links/Icons)',
          value: '{colors.text.default/90}',
        }),
        disabled: value({
          description: 'LikeC4 action icon text color when disabled',
          value: '{colors.text.dimmed}',
        }),
        hover: value({
          description: 'LikeC4 panel action text color on hover',
          value: '{colors.text.bright}',
        }),
        bg: {
          DEFAULT: value({
            description: 'LikeC4 action icon background color',
            value: gray[1],
            dark: alpha(dark[7], 70),
          }),
          hover: value({
            description: 'LikeC4 action icon background color on hover',
            value: gray[2],
            dark: dark[8],
          }),
        },
        warning: {
          DEFAULT: value({
            description: 'LikeC4 action icon text color',
            value: orange[6],
          }),
          hover: value({
            description: 'LikeC4 action icon text color on hover',
            value: orange[7],
            dark: orange[5],
          }),
          bg: {
            DEFAULT: value({
              description: 'LikeC4 action icon background color',
              value: alpha(orange[1], 90),
              dark: alpha(orange[9], 10),
            }),
            hover: value({
              description: 'LikeC4 action icon background color on hover',
              value: alpha(orange[3], 70),
              dark: alpha(orange[9], 20),
            }),
          },
        },
      },
    },

    // LikeC4 dropdown colors
    dropdown: {
      bg: {
        DEFAULT: value({
          description: 'LikeC4 dropdown background color',
          value: white,
          dark: dark[6],
        }),
      },
      border: {
        description: 'LikeC4 dropdown border color',
        value: '{colors.likec4.panel.border}',
      },
    },

    // LikeC4 overlay colors
    overlay: {
      backdrop: {
        DEFAULT: value({
          description: 'LikeC4 overlay backdrop color',
          value: `rgb(15 15 15)`,
          dark: `rgb(34 34 34)`,
        }),
      },
      body: {
        DEFAULT: value({
          description: 'LikeC4 overlay body color',
          value: white,
          dark: dark[6],
        }),
      },
      border: {
        description: 'LikeC4 overlay border color',
        value: '{colors.border.default/50}',
      },
    },

    // LikeC4 walkthrough colors
    walkthrough: {
      parallelFrame: value({
        description: 'LikeC4 walkthrough parallel frame color',
        value: orange[8],
        dark: orange[6],
      }),
    },

    // LikeC4 compare colors
    compare: {
      manual: value({
        description: 'LikeC4 Compare color for manual changes',
        value: orange[8],
        dark: orange[6],
      }),
      outline: value({
        description: 'LikeC4 Compare color for outline around nodes with manual changes',
        value: orange[8],
        dark: alpha(orange[6], 80),
      }),
      latest: value({
        description: 'LikeC4 Compare color for latest changes',
        value: green[6],
      }),
    },
  },
})
