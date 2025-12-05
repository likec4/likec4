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
        display: 'contents',

        '& + .likec4-element-shape': {
          outlineColor: 'likec4.compare.manual.outline',
          outlineWidth: '4px',
          outlineStyle: 'dashed',
          outlineOffset: '1.5',
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
