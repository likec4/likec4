import { Handle, Position } from '@xyflow/react'
import { Fragment, memo } from 'react'

const positions = [Position.Top, Position.Right, Position.Bottom, Position.Left]

/**
 * XYFlow requires handles to be defined on nodes.
 */
export const DefaultHandles = memo(() => (
  <>
    {positions.map((position) => (
      <Fragment key={position}>
        <Handle
          type={'source'}
          position={position}
          className="likec4-node-handle-center"
        />
        <Handle
          type={'target'}
          position={position}
          className="likec4-node-handle-center"
        />
      </Fragment>
    ))}
  </>
))
