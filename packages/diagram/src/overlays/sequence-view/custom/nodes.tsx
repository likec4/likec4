import {
  defaultTheme,
} from '@likec4/core'
import { Box } from '@likec4/styles/jsx'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '../../../base'
import { ElementNodeContainer, ElementShape, ElementTitle } from '../../../base/primitives'
import type { SequenceViewTypes } from '../_types'

const positionMap: Record<SequenceViewTypes.Port['position'], Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
}

function renderPorts(ports: SequenceViewTypes.Port[]) {
  return ports.map(p => (
    <Handle
      key={p.id}
      id={p.id}
      type={p.type}
      position={positionMap[p.position]}
      style={{
        top: p.y,
        left: p.width / 2 - 5,
        width: 10,
        height: p.height,
        right: 'unset',
        bottom: 'unset',
        visibility: 'hidden',
        transform: 'unset',
      }} />
  ))
}

export function ActorNode(props: NodeProps<SequenceViewTypes.ActorNodeData>) {
  const { data: { width, height, verticalLineHeight } } = props
  return (
    <>
      {/* <Box></Box> */}
      <Box
        // css={{
        //   backgroundColor: 'var(--likec4-palette-fill)',
        // }}
        style={{
          position: 'absolute',
          backgroundColor: defaultTheme.elements.gray.fill,
          opacity: 0.5,
          top: 0,
          left: (width / 2) - 1,
          width: 2,
          height: verticalLineHeight,
          zIndex: -1,
          pointerEvents: 'none',
        }}>
      </Box>
      <ElementNodeContainer nodeProps={props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        {
          /* <ElementActions {...props} />
        <ElementDetailsButtonWithHandler {...props} /> */
        }
      </ElementNodeContainer>
      {renderPorts(props.data.ports)}
    </>
  )
}
