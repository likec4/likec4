import { Box, Text } from '@mantine/core'
import type { NodeProps } from '../../../base'
import type { RelationshipsBrowserTypes } from '../_types'
import { emptyNode } from './styles.css'

type EmptyNodeProps = NodeProps<Pick<RelationshipsBrowserTypes.EmptyNodeData, 'column'>>

export function EmptyNode({
  data: {
    column,
  },
}: EmptyNodeProps) {
  return (
    <Box className={emptyNode}>
      <Text c={'dimmed'} fz={'lg'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Text>
    </Box>
  )
}
