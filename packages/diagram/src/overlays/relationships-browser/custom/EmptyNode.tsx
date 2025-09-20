import { Box, Text } from '@mantine/core'
import type { RelationshipsBrowserTypes } from '../_types'
import { emptyNode } from './styles.css'

export function EmptyNode({
  data: {
    column,
  },
}: RelationshipsBrowserTypes.NodeProps<'empty'>) {
  return (
    <Box className={emptyNode}>
      <Text c={'dimmed'} fz={'lg'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Text>
    </Box>
  )
}
