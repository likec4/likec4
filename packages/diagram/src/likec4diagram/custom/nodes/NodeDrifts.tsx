import { Box } from '@likec4/styles/jsx'
import { Notification, Text } from '@mantine/core'
import { NodeToolbar, Position } from '@xyflow/react'
import type { Types } from '../../types'

export type NodeDriftsProps = {
  nodeProps: Types.NodeProps
  position?: 'top' | 'bottom'
}

export function NodeDrifts({
  nodeProps: { data },
  position = 'bottom',
}: NodeDriftsProps) {
  const drifts = data.drifts
  if (!drifts || drifts.length === 0) {
    return null
  }

  const toolbarPosition = position === 'top' ? Position.Top : Position.Bottom

  return (
    <Box
      className="likec4-node-drifts"
      css={{
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        '& + .likec4-element-shape': {
          outlineColor: 'likec4.compare.manual.outline',
          outlineWidth: {
            base: '2px',
            _light: '4px',
          },
          outlineStyle: 'solid',
          outlineOffset: '1',
        },
      }}
    >
      <NodeToolbar isVisible={data.hovered === true} align="start" position={toolbarPosition}>
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
}
