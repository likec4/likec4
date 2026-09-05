import { defineSemanticTokens } from '@pandacss/dev'
import type { SemanticToken, TokenDataTypes } from '@pandacss/types'
import { defaultMantineColors, mantine } from '../generated.ts'
import { alpha } from '../helpers.ts'
import { likec4 } from './semantic-colors.likec4.ts'
import { radixColors } from './semantic-colors.radix.ts'
import { subflow } from './semantic-colors.subflow.ts'
import { surface } from './semantic-colors.surface.ts'
import { black, dark, gray, value, white, yellow } from './value.ts'

export const colors = defineSemanticTokens.colors({
  surface,

  text: {
    DEFAULT: value({
      description: 'Default text color',
      value: black,
      dark: dark[0],
    }),
    default: {
      value: '{colors.text}',
    },
    bright: value({
      description: 'Bright text color',
      value: black,
      dark: white,
    }),
    dimmed: value({
      description: 'Dimmed text color',
      value: gray[6],
      dark: dark[2],
    }),
    'non-essential': value({
      description: 'Non-essential text color',
      value: gray[5],
      dark: dark[3],
    }),
    // type-colour axis: display leads, heading steps down, body = default.
    // dark: display eases ~8% off full white so the biggest bold type doesn't shout.
    display: value({
      description: 'Page titles, hero, big numerals (h1/h2)',
      value: '{colors.text}',
      dark: 'color-mix(in srgb, {colors.text} 92%, {colors.surface.canvas})',
    }),
    heading: value({
      description: 'Section headings (h3-h6)',
      value: 'color-mix(in srgb, {colors.text} 78%, {colors.text.dimmed})',
      dark: 'color-mix(in srgb, {colors.text} 55%, {colors.text.dimmed})',
    }),
    link: value({
      description: 'Link color',
      value: '{colors.likec4.accent.6}',
      dark: '{colors.likec4.accent.4}',
    }),
    'on-primary': value(white),
    'on-inverse': value({
      description: 'On inverse color',
      value: 'rgba(255,255,255,0.92)',
      dark: 'rgba(0,0,0,0.88)',
    }),
  },

  // borders
  border: {
    subtle: value({
      description: 'Subtle border color',
      value: gray[3],
      dark: dark[5],
    }),
    default: value({
      description: 'Default border color',
      value: gray[4],
      dark: dark[4],
    }),
    strong: value({
      description: 'Strong border color',
      value: gray[5],
      dark: dark[3],
    }),
    focus: value({
      description: 'Focus border color',
      value: '{colors.likec4.accent.6}',
      dark: '{colors.likec4.accent.4}',
    }),
  },

  disabled: {
    body: value({
      description: 'Disabled body color',
      value: gray[2],
      dark: `color-mix(in oklab, ${dark[7]} 75%, ${dark[6]})`,
    }),
    text: value({
      description: 'Disabled text color',
      value: gray[5],
      dark: dark[3],
    }),
    border: value({
      description: 'Disabled border color',
      value: gray[3],
      dark: dark[5],
    }),
  },

  // highlight (text mark)
  highlight: {
    body: value({
      description: 'Highlight body color',
      value: yellow[2],
      dark: yellow[5],
    }),
    text: value({
      description: 'Highlight text color',
      value: black,
    }),
  },

  primary: {
    body: {
      DEFAULT: value({
        description: 'Primary body color',
        value: '{colors.likec4.accent.6}',
      }),
      hover: value({
        description: 'Primary body hover color',
        value: '{colors.likec4.accent.5}',
      }),
      focused: value({
        description: 'Primary body focused color',
        value: '{colors.likec4.accent.7}',
      }),
    },
    text: value({
      description: 'Primary text color',
      value: white,
    }),
    border: {
      DEFAULT: value({
        value: '{colors.likec4.accent.6}',
      }),
      hover: value({
        value: '{colors.likec4.accent.5}',
      }),
      focused: value({
        value: '{colors.likec4.accent.7}',
      }),
    },
  },

  warning: {
    body: value({
      description: 'Warning body color',
      value: yellow[2],
      dark: yellow[5],
    }),
    text: value({
      description: 'Highlight text color',
      value: black,
    }),
  },

  diagram: {
    background: {
      DEFAULT: value({
        description: 'Background color',
        value: '{colors.surface.canvas}',
      }),
      pattern: value({
        description: 'Background pattern color',
        value: gray[4],
        dark: alpha(dark[4], 70),
      }),
    },
  },

  likec4,
  subflow,
  ...radixColors,
})
