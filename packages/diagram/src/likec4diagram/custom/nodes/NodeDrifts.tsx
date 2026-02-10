import { Box } from '@likec4/styles/jsx'
import type { Types } from '../../types'

export type NodeDriftsProps = {
  nodeProps: Types.NodeProps
}

export function NodeDrifts({
  nodeProps: { data },
}: NodeDriftsProps) {
  const drifts = data.drifts
  if (!drifts || drifts.length === 0) {
    return null
  }
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
    </Box>
  )
}
