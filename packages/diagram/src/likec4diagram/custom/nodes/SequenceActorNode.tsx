// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Fqn } from '@likec4/core/types'
import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { Handle, Position } from '@xyflow/react'
import { m } from 'motion/react'
import { isTruthy } from 'remeda'
import { ElementData, ElementNodeContainer, ElementShape } from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import type { Types } from '../../types'
import { ElementActions } from './ElementActions'
import { NodeDrifts } from './NodeDrifts'
import { NodeNotes } from './NodeNotes'
import { ElementDetailsButtonWithHandler } from './nodes'
import { ElementToolbar } from './toolbar/ElementToolbar'

const positionMap = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
} as const

const ActorStepPort = ({
  nodeProps: {
    selected,
    data,
  },
  port: p,
}: {
  nodeProps: Types.NodeProps<'seq-actor'>
  port: Types.SequenceActorNodePort
}) => {
  let scaleX = 1, scaleY = 1
  if (data.hovered || selected) {
    scaleX = 1.8
    scaleY = 1.1
  }
  return (
    <>
      <m.div
        data-likec4-color={data.color}
        className={css({
          position: 'absolute',
          backgroundColor: 'var(--likec4-palette-fill)',
          rounded: 'xs',
          // width: {
          //   base: '5px',
          //   _whenHovered: '7px',
          //   _whenSelected: '7px',
          // },
          // transition: 'fast',
          // transitionProperty: 'width',
          // translateX: '-1/2',
          // translateY: '-1/2',
          // translate: 'auto',
        })}
        initial={false}
        // initial={{  }}
        animate={{
          // originY: 0.3,
          scaleX,
          scaleY,
        }}
        transition={{
          type: 'spring',
          // duration: 0.2,
          stiffness: 400,
          damping: 30,
        }}
        style={{
          x: '-50%',
          y: '-50%',
          top: p.cy,
          left: p.cx,
          width: 5,
          // width,
          visibility: p.hidden ? 'hidden' : 'visible',
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
const hasModelFqn = <D extends Types.NodeProps>(node: D): node is D & { data: { modelFqn: Fqn } } =>
  'modelFqn' in node.data && isTruthy(node.data.modelFqn)

export function SequenceActorNode(props: Types.NodeProps<'seq-actor'>) {
  const { enableElementDetails, enableReadOnly, enableCompareWithLatest, enableNotes } = useEnabledFeatures()
  const data = props.data
  const {
    id,
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
          zIndex: 'z-0',
        })}
        style={{
          backgroundColor: 'var(--likec4-palette-stroke)',
          opacity: isHovered ? 0.6 : 0.4,
          left: '50%',
          width: isHovered ? 3 : 2,
          height: viewHeight - positionAbsoluteY,
          // zIndex: -1
        }}
      />
      <ElementNodeContainer nodeProps={props}>
        {enableCompareWithLatest && <NodeDrifts nodeProps={props} />}
        <ElementShape {...props} />
        <ElementData {...props} aria-hidden />
        {hasModelFqn(props) && (
          <>
            <ElementActions {...props} />
            {enableElementDetails && <ElementDetailsButtonWithHandler id={id} data={data} />}
            {!enableReadOnly && <ElementToolbar {...props} />}
          </>
        )}
        {enableNotes && <NodeNotes {...props} />}
      </ElementNodeContainer>
      {ports.map(p => <ActorStepPort key={p.id} port={p} nodeProps={props} />)}
    </>
  )
}

export function SequenceParallelArea(props: Types.NodeProps<'seq-parallel'>) {
  return (
    <Box
      data-likec4-color={props.data.color}
      css={{
        width: '100%',
        height: '100%',
        border: 'default',
        rounded: 'sm',
        '--_color': {
          base: 'var(--likec4-palette-stroke)',
          _dark: '[color-mix(in oklab, var(--likec4-palette-hiContrast) 40%, var(--likec4-palette-fill))]',
        },
        borderColor: '[var(--_color)/30]',
        backgroundColor: 'var(--likec4-palette-fill)/15',
        pointerEvents: 'none',
        paddingLeft: '2',
        paddingTop: '0.5',
        fontSize: 'xs',
        fontWeight: 'bold',
        letterSpacing: '.75px',
        color: '[var(--_color)/75]',
      }}
    >
      PARALLEL
    </Box>
  )
}
