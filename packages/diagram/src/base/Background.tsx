import { nonexhaustive } from '@likec4/core'
import { type BackgroundProps, Background as XYFlowBackground, BackgroundVariant } from '@xyflow/react'
import type { OverrideProperties } from 'type-fest'

export type XYBackgroundVariant = 'dots' | 'lines' | 'cross'
export type XYBackground =
  | XYBackgroundVariant
  | BackgroundProps
// | OverrideProperties<BackgroundProps, {
//   variant: XYBackgroundVariant
// }>

export type XYBackgroundProps = {
  background: XYBackground
}

function literalToEnum(value: XYBackgroundVariant): BackgroundVariant {
  switch (value) {
    case 'dots':
      return BackgroundVariant.Dots
    case 'lines':
      return BackgroundVariant.Lines
    case 'cross':
      return BackgroundVariant.Cross
    default:
      nonexhaustive(value)
  }
}

export function Background({ background }: XYBackgroundProps) {
  if (typeof background === 'string') {
    return <XYFlowBackground variant={literalToEnum(background)} size={2} gap={20} />
  }
  return <XYFlowBackground {...background} />
}
