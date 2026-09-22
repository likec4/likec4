import type { DynamicViewFlow } from '@likec4/core'
import { css } from '@likec4/styles/css'
import {
  IconAlertTriangle,
  IconArrowFork,
  IconArrowGuide,
  IconCornerDownRight,
  IconPlayerStop,
  IconRepeat,
} from '@tabler/icons-react'

export type FlowType = DynamicViewFlow.SubFlowType

/**
 * PandaCSS `colorPalette` classes for each sub-flow palette.
 * Declared as literals so the static analyzer can extract them.
 */
const palette = {
  loop: css({ colorPalette: 'subflow.loop' }),
  opt: css({ colorPalette: 'subflow.opt' }),
  par: css({ colorPalette: 'subflow.par' }),
  break: css({ colorPalette: 'subflow.break' }),
  alt: css({ colorPalette: 'subflow.alt' }),
  try: css({ colorPalette: 'subflow.try' }),
} as const

export type FlowPresentation = {
  readonly paletteClass: string
  readonly tag: string
  readonly Icon: typeof IconRepeat
}

/** How each sub-flow operator is labelled and coloured in the outline. */
export const flowPresentation: Record<FlowType, FlowPresentation> = {
  loop: { paletteClass: palette.loop, tag: 'loop', Icon: IconRepeat },
  opt: { paletteClass: palette.opt, tag: 'opt', Icon: IconArrowGuide },
  par: { paletteClass: palette.par, tag: 'par', Icon: IconArrowFork },
  break: { paletteClass: palette.break, tag: 'break', Icon: IconPlayerStop },
  alt: { paletteClass: palette.alt, tag: 'alt', Icon: IconArrowFork },
  'alt-when': { paletteClass: palette.alt, tag: 'when', Icon: IconCornerDownRight },
  'alt-else': { paletteClass: palette.alt, tag: 'else', Icon: IconCornerDownRight },
  'alt-if': { paletteClass: palette.alt, tag: 'if', Icon: IconCornerDownRight },
  try: { paletteClass: palette.try, tag: 'try', Icon: IconAlertTriangle },
  'try-block': { paletteClass: palette.try, tag: 'block', Icon: IconCornerDownRight },
  'try-catch': { paletteClass: palette.break, tag: 'catch', Icon: IconCornerDownRight },
  'try-finally': { paletteClass: palette.break, tag: 'finally', Icon: IconCornerDownRight },
}
