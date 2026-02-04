import { Box } from '@likec4/styles/jsx'
import { Text } from '@mantine/core'
import type { RelationshipsBrowserTypes } from '../_types'

export function EmptyNode({
  data: {
    column,
  },
}: RelationshipsBrowserTypes.NodeProps<'empty'>) {
  return (
    <Box
      css={{
        width: '100%',
        height: '100%',
        border: `3px dashed`,
        borderColor: `default.border`,
        borderRadius: 'md',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text c={'dimmed'} fz={'lg'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Text>
    </Box>
  )
}
