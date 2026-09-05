import { defineSemanticTokens } from '@pandacss/dev'
import { dark, gray, value, white } from './value.ts'

export const { surface } = defineSemanticTokens.colors({
  surface: {
    canvas: value({
      description: 'Canvas surface color (Diagram background)',
      value: white,
      dark: dark[7],
    }),
    default: value({
      description: 'Default surface color (ui/panels/cards)',
      value: white,
      dark: dark[6],
    }),
    sunken: {
      DEFAULT: value({
        description: 'Wells, inset areas, table headers · dark: between canvas & default',
        value: gray[0],
        dark: `color-mix(in oklab, ${dark[7]} 65%, ${dark[6]})`,
      }),
      hover: value({
        value: gray[1],
        dark: `color-mix(in oklab, ${dark[7]} 25%, ${dark[6]})`,
      }),
    },
    code: value({
      description: 'Code background color',
      value: gray[2],
      dark: dark[7],
    }),
    field: {
      DEFAULT: value({
        description: 'Input / select / textarea fills (scoped role, not a 4th general surface)',
        value: gray[1],
        dark: dark[5],
      }),
      hover: value({
        description: 'Input / select / textarea hover color',
        value: gray[2],
        dark: `color-mix(in oklab, ${dark[4]} 25%, ${dark[5]})`,
      }),
    },
    hover: value({
      description: 'Row / item hover',
      value: gray[1],
      dark: dark[5],
    }),
    selected: value({
      description: 'Selected / active item (quiet wash; selected border stays solid 2px)',
      value: '{colors.likec4.accent.7}',
      dark: '{colors.likec4.accent.5}',
    }),
  },
})
