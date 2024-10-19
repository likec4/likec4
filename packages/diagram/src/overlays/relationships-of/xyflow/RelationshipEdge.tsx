import { ActionIcon, Box, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBoxMultipleFilled, IconZoomScan } from '@tabler/icons-react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'
import clsx from 'clsx'
import { only } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import { stopPropagation } from '../../../xyflow/utils'
import type { XYFlowTypes } from '../_types'
import { ZIndexes } from '../use-layouted-relationships'
import * as css from './styles.css'

export function RelationshipEdge({
  data,
  label,
  ...props
}: EdgeProps<XYFlowTypes.Edge>) {
  const onNavigateTo = useDiagramState(s => s.onNavigateTo)
  const [edgePath, labelX, labelY] = getBezierPath(props)
  const navigateTo = onNavigateTo ? only(data.relations)?.navigateTo : undefined
  const isMultiRelation = data.relations.length > 1
  const technology = only(data.relations)?.technology
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
            <Group gap={6} wrap="nowrap">
              {isMultiRelation && (
                <ThemeIcon size={'sm'} variant="transparent" color="orange">
                  <IconBoxMultipleFilled style={{ width: '80%' }} />
                </ThemeIcon>
              )}
              <Text
                fw={isMultiRelation ? '500' : '400'}
                component={'div'}
                className={css.edgeLabelText}
                lineClamp={3}>
                {label}
              </Text>
            </Group>
          )}
          {technology && (
            <Text component={'div'} className={css.edgeLabelTechnology}>
              {'[ '}
              {technology}
              {' ]'}
            </Text>
          )}
          {navigateTo && (
            <Box ta={'center'} mt={4}>
              <ActionIcon
                variant="default"
                size={'sm'}
                radius="sm"
                onPointerDownCapture={stopPropagation}
                onClick={event => {
                  event.stopPropagation()
                  onNavigateTo?.(navigateTo, event)
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
