import { Box } from '@mantine/core'
import type { NodeProps } from '../../../base'
import { Text } from '../../../controls/Text'
import type { RelationshipsBrowserTypes } from '../_types'
import * as css from './styles.css'

type EmptyNodeProps = NodeProps<Pick<RelationshipsBrowserTypes.EmptyNodeData, 'column'>>

export function EmptyNode({
  data: {
    column,
  },
}: EmptyNodeProps) {
  return (
    <Box className={css.emptyNode}>
      <Text c={'dimmed'} fz={'lg'} fw={500}>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Text>
    </Box>
  )
}
