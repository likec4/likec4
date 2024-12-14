import { ActionIcon, Box, Stack, Text } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'
import clsx from 'clsx'
import { useDiagramState } from '../../../hooks/useDiagramState'
import { stopPropagation } from '../../../xyflow/utils'
import { useOverlayDialog } from '../../OverlayContext'
import * as css from '../../shared/xyflow/RelationshipEdge.css'
import type { XYFlowTypes } from '../_types'
import { ZIndexes } from '../use-layouted-edge-details'

export function RelationshipEdge({
  data,
  label,
  ...props
}: EdgeProps<XYFlowTypes.Edge>) {
  const overlay = useOverlayDialog()
  const onNavigateTo = useDiagramState(s => s.onNavigateTo)
  const [edgePath, labelX, labelY] = getBezierPath(props)
  const navigateTo = data.navigateTo
  return (
    <>
      <g
        className={css.edgeContainer}
        data-edge-dimmed={data.dimmed}
        data-edge-hovered={data.hovered}
      >
        <BaseEdge
          path={edgePath}
          {...props}
        />
      </g>
      <EdgeLabelRenderer>
        <Stack
          gap={2}
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
          {label && (
            <Text component={'div'} className={css.edgeLabelText} lineClamp={3}>
              {label}
            </Text>
          )}
          {data.technology && (
            <Text component={'div'} className={css.edgeLabelTechnology}>
              {'[ '}
              {data.technology}
              {' ]'}
            </Text>
          )}
          {navigateTo && onNavigateTo && (
            <Box ta={'center'} mt={4}>
              <ActionIcon
                variant="default"
                size={'sm'}
                radius="sm"
                onPointerDownCapture={stopPropagation}
                onClick={event => {
                  event.stopPropagation()
                  overlay.close(() => {
                    onNavigateTo(navigateTo)
                  })
                }}
                role="button"
                onDoubleClick={stopPropagation}
              >
                <IconZoomScan />
              </ActionIcon>
            </Box>
          )}
        </Stack>
      </EdgeLabelRenderer>
    </>
  )
}
