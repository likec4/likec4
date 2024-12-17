import { Box, Text as MantineText } from '@mantine/core'
import { type NodeProps } from '@xyflow/react'
import type { XYFlowTypes } from '../_types'
import * as css from './EmptyNode.css'

const Text = MantineText.withProps({
  component: 'div'
})

type EmptyNodeProps = NodeProps<XYFlowTypes.EmptyNode>

export function EmptyNode({
  data: {
    column
  }
}: EmptyNodeProps) {
  return (
    <Box className={css.emptyNode}>
      <Text c={'dimmed'} fz={'lg'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Text>
    </Box>
  )
}
