import { Box } from '@mantine/core'
import { type NodeProps } from '@xyflow/react'
import type { RelationshipsOfFlowTypes } from '../_types'
import * as css from './styles.css'
import { Text } from '../../../controls/Text'

type EmptyNodeProps = NodeProps<RelationshipsOfFlowTypes.EmptyNode>

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
