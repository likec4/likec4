import { Handle, Position } from '@xyflow/react'
import type { CSSProperties } from 'react'

const style: CSSProperties = {
  top: '50%',
  left: '50%',
  right: 'unset',
  bottom: 'unset',
  visibility: 'hidden',
  width: 5,
  height: 5,
  transform: 'translate(-50%, -50%)',
}

/**
 * XYFlow requires handles to be defined on nodes.
 */
export const DefaultHandles = () => (
  <>
    <Handle type="target" position={Position.Top} style={style} />
    <Handle type="target" position={Position.Left} style={style} />
    <Handle type="source" position={Position.Right} style={style} />
    <Handle type="source" position={Position.Bottom} style={style} />
  </>
)
