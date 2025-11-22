import { css, cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { Notification, Text } from '@mantine/core'
import { NodeToolbar, Position } from '@xyflow/react'
import type { Types } from '../../types'

export type EdgeDriftsProps = {
  edgeProps: Types.EdgeProps
  svgPath: string
}

export function EdgeDrifts({
  edgeProps: { data },
  svgPath,
}: EdgeDriftsProps) {
  const drifts = data.drifts
  if (!drifts || drifts.length === 0) {
    return null
  }

  return (
    <path
      className={cx(
        'react-flow__edge-path',
        css({
          pointerEvents: 'none',
          stroke: 'likec4.compare.manual.outline',
          fill: 'none',
          mixBlendMode: 'plus-lighter',
          strokeWidth: {
            base: '8px',
            _whenHovered: '12px',
          },
          strokeOpacity: {
            base: 0.3,
            _whenHovered: 0.5,
          },
        }),
      )}
      d={svgPath}
      strokeLinecap="round"
    />
  )
}
