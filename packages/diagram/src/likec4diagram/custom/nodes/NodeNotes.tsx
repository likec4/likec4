import { Box } from '@likec4/styles/jsx'
import { nodeNotes } from '@likec4/styles/recipes'
import type { BaseNodePropsWithData } from '../../../base/types'
import type { Types } from '../../types'

type RequiredData = Pick<Types.NodeData, 'id' | 'notes' | 'width' | 'height'>

export type NodeNotesProps = BaseNodePropsWithData<RequiredData>

export function NodeNotes({
  data,
}: NodeNotesProps) {
  const notes = data.notes
  if (!notes) {
    return null
  }

  return (
    <Box className={nodeNotes()}>
      <div className="likec4-node-notes__indicator" />
    </Box>
  )
}
