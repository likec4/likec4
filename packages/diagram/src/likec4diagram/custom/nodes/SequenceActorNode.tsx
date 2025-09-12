import { defaultTheme } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import type { NodeProps } from '@xyflow/react'
import { Handle } from '@xyflow/react'
import { Position } from '@xyflow/system'
import { ElementNodeContainer, ElementShape, ElementTitle } from '../../../custom'
import { type Types } from '../../types'
import { ElementActions } from './ElementActions'
import { ElementDetailsButtonWithHandler } from './nodes'

const positionMap: Record<Types.SequenceActorNodePort['position'], Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
}

const ActorStepPort = ({
  data,
  port: p,
}: {
  data: Types.SequenceActorNodeData
  port: Types.SequenceActorNodePort
}) => {
  return (
    <>
      <Box
        data-likec4-color={data.color}
        className={css({
          position: 'absolute',
          backgroundColor: 'var(--likec4-palette-fill)',
          rounded: 'xs',
          width: {
            base: '5px',
            _whenHovered: '7px',
            _whenSelected: '7px',
          },
          // pointerEvents: 'none',
          transition: 'fast',
          translateX: '-1/2',
          translateY: '-1/2',
          translate: 'auto',
          // transform: 'translate',
        })}
        style={{
          top: p.cy,
          left: p.cx,
          height: p.height,
          // transform: p.type === 'source' ? 'translate(-50%, -16px)' : 'translate(-50%, -50%)',
          // transform: 'translate(-50%, -50%)',
          // zIndex: p.type === 'source' ? 1 : 0,
        }}
      />
      <Handle
        id={p.id}
        type={p.type}
        position={positionMap[p.position]}
        style={{
          top: p.cy - 3,
          left: p.cx - 3,
          width: 6,
          height: 6,
          right: 'unset',
          bottom: 'unset',
          visibility: 'hidden',
          transform: p.position === 'left' ? 'translate(-150%, 0)' : 'translate(100%, 0)',
        }} />
    </>
  )
}

export function SequenceActorNode(props: NodeProps<Types.SequenceActorNode>) {
  const data = props.data
  const {
    positionAbsoluteY,
    data: {
      viewHeight,
      hovered: isHovered = false,
      ports,
    },
  } = props

  return (
    <>
      <Box
        className={css({
          position: 'absolute',
          rounded: 'xs',
          top: '1',
          pointerEvents: 'none',
          transition: 'fast',
          translateX: '-1/2',
          translate: 'auto',
          // transform: 'translate',
        })}
        style={{
          // position: 'absolute',
          backgroundColor: defaultTheme.elements.gray.fill,
          opacity: isHovered ? 0.5 : 0.4,
          left: '50%',
          width: isHovered ? 3 : 2,
          height: viewHeight - positionAbsoluteY,
          zIndex: -1,
          pointerEvents: 'none',
          // top: p.y,
          // left: p.width / 2,
          // height: p.type === 'source' ? 48 : 32,
          // transform: p.type === 'source' ? 'translate(-50%, -16px)' : 'translate(-50%, -50%)',
          // transform: 'translate(-50%, -50%)',
          // zIndex: p.type === 'source' ? 1 : 0,
        }}
      />
      {
        /* <div
        // css={{
        //   backgroundColor: 'var(--likec4-palette-fill)',
        // }}
        style={{
          position: 'absolute',
          backgroundColor: defaultTheme.elements.gray.fill,
          opacity: 0.5,
          top: 8,
          left: 'calc(50% - 1px)',
          width: 2,
          height: viewHeight - positionAbsoluteY,
          zIndex: -1,
          pointerEvents: 'none',
        }}>
      </div> */
      }
      <ElementNodeContainer nodeProps={props}>
        <ElementShape {...props} />
        <ElementTitle {...props} />
        {data.modelFqn && (
          <>
            <ElementActions {...props} data={data as Types.ElementNodeData} />
            <ElementDetailsButtonWithHandler {...props} data={data as Types.ElementNodeData} />
          </>
        )}
      </ElementNodeContainer>
      {ports.map(p => <ActorStepPort key={p.id} port={p} data={props.data} />)}
    </>
  )
}

export function SequenceParallelArea(props: NodeProps<Types.SequenceActorNode>) {
  return (
    <Box
      data-likec4-color={props.data.color}
      css={{
        width: '100%',
        height: '100%',
        border: 'default',
        rounded: 'xs',
        borderWidth: 1,
        borderColor: 'var(--likec4-palette-stroke)/50',
        backgroundColor: 'var(--likec4-palette-fill)/5',
        pointerEvents: 'none',
        paddingLeft: '2',
        paddingTop: '0.5',
        fontSize: 'xs',
        fontWeight: 'bold',
        letterSpacing: '.5px',
        color: 'var(--likec4-palette-stroke)/75',
      }}
    >
      PARALLEL
    </Box>
  )
}
