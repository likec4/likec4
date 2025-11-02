import type { ComputedNodeStyle, DiagramNodeDriftReason, ElementShape, NonEmptyReadonlyArray } from '@likec4/core/types'
import { Box, HStack, VStack } from '@likec4/styles/jsx'
import { Notification, Text } from '@mantine/core'
import { NodeToolbar, Position } from '@xyflow/react'
import { Fragment } from 'react'
import type { Types } from '../../types'

type ElementNodeDrifts = Types.NodeProps<'element' | 'deployment'>

export function ElementNodeDrifts(
  { data, width, height }: ElementNodeDrifts,
) {
  const drifts = data.drifts
  if (!drifts || drifts.length === 0) {
    return null
  }

  const w = width ?? data.width
  const h = height ?? data.height

  return (
    <Box
      className="likec4-node-drifts"
      css={{
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        '& + .likec4-element-shape': {
          outlineColor: {
            base: 'mantine.colors.orange[6]',
            _light: 'mantine.colors.orange[8]',
          },
          outlineWidth: {
            base: '2px',
            _light: '4px',
          },
          outlineStyle: 'solid',
          outlineOffset: '1',
        },
      }}
    >
      <NodeToolbar isVisible={data.hovered === true} align="start" position={Position.Bottom}>
        <Notification
          color="orange"
          withBorder={false}
          withCloseButton={false}
          title="Changes:">
          {drifts.map((drift) => (
            <Text mt={2} size="sm" lh="xs" key={drift}>
              - {drift}
            </Text>
          ))}
        </Notification>
      </NodeToolbar>
    </Box>
  )

  // if (data.shape === 'rectangle') {
  //   return <ShapeHtml multiple={isMultiple} withOutLine={showSeletionOutline} />
  // }

  // const className = elementShapeRecipe({
  //   shapetype: 'svg',
  // })

  // return (
  //   <>
  //     {isMultiple && (
  //       <svg className={className} data-likec4-shape-multiple="true" viewBox={`0 0 ${w} ${h}`}>
  //         <ShapeSvg shape={data.shape} w={w} h={h} />
  //       </svg>
  //     )}
  //     <svg className={className} viewBox={`0 0 ${w} ${h}`}>
  //       {showSeletionOutline && <ShapeSvgOutline shape={data.shape} w={w} h={h} />}
  //       <ShapeSvg shape={data.shape} w={w} h={h} />
  //     </svg>
  //   </>
  // )
}
