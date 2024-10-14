import type { RelationID } from '@likec4/core'
import { ActionIcon, Box, Group, Text, ThemeIcon } from '@mantine/core'
import { IconBoxMultipleFilled, IconFileSymlink } from '@tabler/icons-react'
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from '@xyflow/react'
import clsx from 'clsx'
import { only } from 'remeda'
import { useDiagramState, useDiagramStoreApi } from '../../../hooks/useDiagramState'
import type { XYFlowTypes } from '../_types'
import { ZIndexes } from '../use-layouted-relationships'
import * as css from './styles.css'

function GoToSourceButton({ relationId }: { relationId: RelationID }) {
  const diagramApi = useDiagramStoreApi()
  return (
    <ActionIcon
      size={22}
      variant="default"
      onClick={e => {
        e.stopPropagation()
        diagramApi.getState().onOpenSourceRelation?.(relationId)
      }}>
      <IconFileSymlink size={'70%'} stroke={1.8} />
    </ActionIcon>
  )
}

export function RelationshipEdge({
  data,
  label,
  ...props
}: EdgeProps<XYFlowTypes.Edge>) {
  const [edgePath, labelX, labelY] = getBezierPath(props)
  const hasOpenSourceRelation = useDiagramState(s => !!s.onOpenSourceRelation)

  const isMultiRelation = data.relations.length > 1
  const relationId = only(data.relations)?.id

  return (
    <>
      <g
        className={css.edgePath}
        data-edge-dimmed={data.dimmed}
        data-edge-hovered={data.hovered}
        //  style={{
        //   opacity: data.dimmed ? 0.2 : 1,
        //   transition: 'all 0.19s ease-in-out'
        // }}>
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
            <Group gap={6}>
              {isMultiRelation && (
                <ThemeIcon size={'sm'} variant="transparent" color="orange">
                  <IconBoxMultipleFilled style={{ width: '80%' }} />
                </ThemeIcon>
              )}
              <Text fw={isMultiRelation ? '500' : '400'} component={'div'} className={css.edgeLabelText} lineClamp={3}>
                {label}
              </Text>
            </Group>
            {hasOpenSourceRelation && relationId && (
              <Box className={css.edgeOpenSourceBtn}>
                <GoToSourceButton relationId={relationId} />
              </Box>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
