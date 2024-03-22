import { nonexhaustive } from '@likec4/core'
import { Background, type BackgroundProps, BackgroundVariant } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { memo } from 'react'
import type { OverrideProperties, SetRequired } from 'type-fest'

export type XYBackgroundVariant = 'dots' | 'lines' | 'cross'
export type XYBackgroundProps =
  | XYBackgroundVariant
  | OverrideProperties<BackgroundProps, {
    variant: XYBackgroundVariant
  }>

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

export const XYFlowBackground = memo<{ background: XYBackgroundProps }>(({ background }) => {
  if (typeof background === 'string') {
    return <Background variant={literalToEnum(background)} />
  }
  const { variant, ...rest } = background
  return <Background variant={literalToEnum(variant)} {...rest} />
}, deepEqual)
