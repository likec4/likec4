import { nonexhaustive } from '@likec4/core'
import { type BackgroundProps, Background as XYFlowBackground, BackgroundVariant } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { memo } from 'react'

export type XYBackgroundVariant = 'dots' | 'lines' | 'cross'
export type XYBackground =
  | XYBackgroundVariant
  | BackgroundProps

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

const compareProps = (prev: XYBackgroundProps, next: XYBackgroundProps) => {
  if (typeof prev.background === 'string' && typeof next.background === 'string') {
    return prev.background === next.background
  }
  return deepEqual(prev.background, next.background)
}

export const Background = memo<XYBackgroundProps>(({ background }) => {
  if (typeof background === 'string') {
    return <XYFlowBackground variant={literalToEnum(background)} size={2} gap={20} />
  }
  return <XYFlowBackground {...background} />
}, compareProps)
Background.displayName = 'Background'
