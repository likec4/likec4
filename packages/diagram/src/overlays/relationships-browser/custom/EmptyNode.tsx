import { Box } from '@likec4/styles/jsx'
import { Txt } from '@likec4/styles/jsx'
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
        border: `[3px dashed {colors.border.default}]`,
        borderRadius: 'md',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Txt textStyle={'dimmed'} fontSize={'lg'} medium>No {column === 'incomers' ? 'incoming' : 'outgoing'}</Txt>
    </Box>
  )
}
