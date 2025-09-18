import { Handle, Position } from '@xyflow/react'
import type { CSSProperties } from 'react'

const style: CSSProperties = {
  top: '50%',
  left: '50%',
  visibility: 'hidden',
  right: 'unset',
  bottom: 'unset',
  width: 1,
  height: 1,
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
