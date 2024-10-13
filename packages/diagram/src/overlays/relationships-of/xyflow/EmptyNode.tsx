import { Box, Text as MantineText } from '@mantine/core'
import { type NodeProps } from '@xyflow/react'
import type { XYFlowTypes } from '../_types'
import * as css from './styles.css'

const Text = MantineText.withProps({
  component: 'div'
})

type EmptyNodeProps = NodeProps<XYFlowTypes.EmptyNode>

export function EmptyNode({
  data: {
    column
  }
}: EmptyNodeProps) {
  // const xyflow = useReactFlow()
  // const sortedports.right = pipe(
  //   ports.right,
  //   map(port => {
  //     const node = xyflow.getInternalNode(port.id)!
  //     node?.internals.positionAbsolute
  //     return {
  //       ...port,
  //       positionY: node.internals.positionAbsolute.y + ((node.height ?? 0) / 2)
  //     }
  //   }),
  //   sortBy(prop('positionY'))
  // )
  return (
    <>
      <Box className={css.emptyNode}>
        <Text c={'dimmed'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Text>
      </Box>
    </>
  )
}
