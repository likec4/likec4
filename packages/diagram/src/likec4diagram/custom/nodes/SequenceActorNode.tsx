import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { Handle, Position } from '@xyflow/react'
import { isTruthy } from 'remeda'
import type { SetNonNullable } from 'type-fest'
import { ElementData, ElementNodeContainer, ElementShape } from '../../../base-primitives'
import type { Types } from '../../types'
import { ElementActions } from './ElementActions'
import { ElementDetailsButtonWithHandler } from './nodes'

const positionMap = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
} as const

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
          transition: 'fast',
          translateX: '-1/2',
          translateY: '-1/2',
          translate: 'auto',
        })}
        style={{
          top: p.cy,
          left: p.cx,
          height: p.height,
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

const hasModelFqn = <D extends Types.SequenceActorNodeData>(data: D): data is SetNonNullable<D, 'modelFqn'> =>
  isTruthy(data.modelFqn)

export function SequenceActorNode(props: Types.NodeProps<'seq-actor'>) {
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
        data-likec4-color={'gray'}
        className={css({
          position: 'absolute',
          rounded: 'xs',
          top: '1',
          pointerEvents: 'none',
          transition: 'fast',
          translateX: '-1/2',
          translate: 'auto',
        })}
        style={{
          backgroundColor: 'var(--likec4-palette-stroke)',
          opacity: isHovered ? 0.6 : 0.4,
          left: '50%',
          width: isHovered ? 3 : 2,
          height: viewHeight - positionAbsoluteY,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      <ElementNodeContainer nodeProps={props}>
        <ElementShape {...props} />
        <ElementData {...props} />
        {hasModelFqn(data) && (
          <>
            <ElementActions {...props} data={data} />
            <ElementDetailsButtonWithHandler {...props} data={data} />
          </>
        )}
      </ElementNodeContainer>
      {ports.map(p => <ActorStepPort key={p.id} port={p} data={props.data} />)}
    </>
  )
}

export function SequenceParallelArea(props: Types.NodeProps<'seq-parallel'>) {
  const {
    data: {
      color,
      kind = 'parallel',
      pathIndex,
      isDefaultPath,
      pathTitle,
      pathName,
      branchLabel,
    },
  } = props
  const displayTitle = pathTitle ?? pathName ?? branchLabel ?? 'PARALLEL'
  const headline = kind === 'alternate' ? 'ALTERNATE' : 'PARALLEL'
  return (
    <Box
      data-likec4-color={color}
      data-likec4-branch-kind={kind}
      data-likec4-branch-default={isDefaultPath ? 'true' : undefined}
      css={{
        width: '100%',
        height: '100%',
        border: 'default',
        rounded: 'sm',
        borderWidth: 1,
        '--_color': {
          base: 'var(--likec4-palette-stroke)',
          _dark: '[color-mix(in srgb, var(--likec4-palette-hiContrast) 40%, var(--likec4-palette-fill))]',
        },
        borderColor: '[var(--_color)/30]',
        backgroundColor: 'var(--likec4-palette-fill)/15',
        pointerEvents: 'none',
        paddingLeft: '2',
        paddingTop: '1',
        paddingRight: '2',
        paddingBottom: '1',
        display: 'flex',
        flexDirection: 'column',
        rowGap: '0.5',
        fontSize: 'xs',
        fontWeight: 'bold',
        letterSpacing: '.75px',
        color: '[var(--_color)/75]',
      }}
    >
      <Box
        as="span"
        css={{
          fontSize: '2xs',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {headline}
        {pathIndex ? ` ${pathIndex}` : ''}
        {isDefaultPath ? ' • DEFAULT' : ''}
      </Box>
      <Box as="span" css={{ textTransform: 'uppercase', lineHeight: 'shorter' }}>
        {displayTitle}
      </Box>
    </Box>
  )
}
