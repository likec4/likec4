import { Box } from '@likec4/styles/jsx'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '../../../base'
import type { SequenceViewTypes } from '../_types'

function Ports({ ports }: { ports: SequenceViewTypes.Ports }) {
  return (
    <>
      {ports.in.map(p => (
        <Handle
          key={p.step}
          id={p.step}
          type="target"
          position={Position.Left}
          style={{
            top: `calc(${100 * p.row / ports.totalRows}% + 16px)`,
            height: 32,
            visibility: 'hidden',
            transform: 'unset',
          }} />
      ))}
      {ports.out.map(p => (
        <Handle
          key={p.step}
          id={p.step}
          type="source"
          position={Position.Right}
          style={{
            top: `calc(${100 * p.row / ports.totalRows}% + 16px)`,
            height: 32,
            right: 'unset',
            transform: 'unset',
            visibility: 'hidden',
          }} />
      ))}
    </>
  )
}

export function ActorNode(props: NodeProps<SequenceViewTypes.ActorNodeData>) {
  return (
    <Box
      style={{
        width: 6,
        height: props.height,
      }}
    >
      <div>{props.data.title}</div>
      <Ports ports={props.data.ports} />
    </Box>
  )
}
