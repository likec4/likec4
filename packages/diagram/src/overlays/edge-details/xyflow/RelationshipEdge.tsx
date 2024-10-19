import { Group, Text, ThemeIcon } from '@mantine/core'
import { IconBoxMultipleFilled } from '@tabler/icons-react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'
import clsx from 'clsx'
import type { XYFlowTypes } from '../_types'
import { ZIndexes } from '../use-layouted-edge-details'
import * as css from './styles.css'

export function RelationshipEdge({
  data,
  label,
  ...props
}: EdgeProps<XYFlowTypes.Edge>) {
  const [edgePath, labelX, labelY] = getBezierPath(props)
  return (
    <>
      <g
        className={css.edgePath}
        data-edge-dimmed={data.dimmed}
        data-edge-hovered={data.hovered}
      >
        <BaseEdge
          path={edgePath}
          {...props}
        />
      </g>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              maxWidth: Math.abs(props.targetX - props.sourceX - 40),
              zIndex: ZIndexes.max
            }}
            className={clsx([
              css.edgeLabel,
              'nodrag nopan'
            ])}
            data-edge-dimmed={data.dimmed}
            data-edge-hovered={data.hovered}
          >
            <Text component={'div'} className={css.edgeLabelText} lineClamp={3}>
              {label}
            </Text>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
