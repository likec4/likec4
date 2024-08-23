import { nonexhaustive } from '@likec4/core'
import { Background, type BackgroundProps, BackgroundVariant } from '@xyflow/react'
import type { OverrideProperties } from 'type-fest'

export type XYBackgroundVariant = 'dots' | 'lines' | 'cross'
export type XYBackground =
  | XYBackgroundVariant
  | OverrideProperties<BackgroundProps, {
    variant: XYBackgroundVariant
  }>

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

export function XYFlowBackground({ background }: XYBackgroundProps) {
  if (typeof background === 'string') {
    return <Background variant={literalToEnum(background)} size={2} gap={20} />
  }
  const { variant, ...rest } = background
  return <Background variant={literalToEnum(variant)} {...rest} />
}
