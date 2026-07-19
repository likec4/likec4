import { ensureSizes } from '@likec4/core'
import { ifilter, imap, invariant, toArray } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { elementNode } from '@likec4/styles/recipes'
import { useNodesData } from '@xyflow/react'
import { getNodeDimensions } from '@xyflow/system'
import { shallowEqual } from 'fast-equals'
import {
  type Variants,
  AnimatePresence,
  LayoutGroup,
} from 'motion/react'
import * as m from 'motion/react-m'
import { useCallback } from 'react'
import { clamp, omit, pipe } from 'remeda'
import {
  ElementData,
  ElementShape,
} from '../../base-primitives'
import { useDiagram, useXYStore } from '../../hooks'
import { selectXYStore } from '../../hooks/useXYFlow'
import { roundDpr } from '../../utils'
import type { Types } from '../types'

/**
 * Returns actor nodes from the current XY node list.
 * Only re-runs when xynodes reference changes.
 */
const selectActorNodes = selectXYStore((state) => {
  const [tx, ty, tScale] = state.transform

  const x1 = -tx / tScale
  const y1 = -ty / tScale
  const x2 = x1 + state.width / tScale

  return pipe(
    state.nodeLookup.values(),
    ifilter(node => {
      const xynode = node.internals.userNode
      if (xynode.type !== 'seq-actor' || !!node.data.dimmed) {
        return false
      }
      const { width, height } = getNodeDimensions(node)

      const centerX = xynode.data.x + width / 2
      if ((xynode.data.y + height - 8) < y1 && (centerX - 30 > x1 && centerX + 30 < x2)) {
        return true
      }
      return false
    }),
    imap(node => node.id),
    toArray(),
  )
})
/**
 * Shows sequence actors at the top of the diagram, if current viewport does not fit them
 */
export function FloatingSequenceActors({ isActiveWalkthrough }: { isActiveWalkthrough: boolean }) {
  // const api = useXYStoreApi()
  const ids = useXYStore(selectActorNodes)

  return (
    <LayoutGroup>
      <AnimatePresence anchorY="top">
        {ids.map(id => <SequenceActor key={id} id={id} top={isActiveWalkthrough ? 24 : 64} />)}
      </AnimatePresence>
    </LayoutGroup>
  )
}

const variants = {
  initial: {
    opacity: .7,
    scale: 0.9,
  },
  normal: {
    opacity: .95,
    scale: 1,
  },
  hovered: {
    opacity: 1,
    scale: 1.07,
  },
  tap: {
    opacity: 1,
    scale: 0.98,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
  },
} satisfies Variants

function SequenceActor({ id, top }: { id: string; top: number }) {
  const node = useNodesData<Types.SequenceActorNode>(id)
  const diagram = useDiagram()

  let { centerX, scale, width, height } = useXYStore(useCallback(state => {
    const node = state.nodeLookup.get(id)
    if (!node) {
      return {
        centerX: 0,
        scale: 1,
      }
    }
    const { width, height } = getNodeDimensions(node)
    const [tx, , tScale] = state.transform

    const xynode = node.internals.userNode
    invariant(xynode.type === 'seq-actor')

    const scale = clamp(0.6 * tScale, {
      min: 0.2,
      max: 0.6,
    })

    return {
      centerX: roundDpr((node.position.x + width / 2) * tScale + tx),
      scale,
      width,
      height,
    }
  }, [id]))

  if (!node) {
    return null
  }
  const { data } = node
  const isHovered = data.hovered === true

  const {
    size,
    padding,
    textSize,
  } = ensureSizes(data.style ?? {})

  return (
    <div
      data-likec4-color={data.color}
      data-likec4-shape={data.shape}
      data-likec4-shape-size={size}
      data-likec4-spacing={padding}
      data-likec4-text-size={textSize}
      data-likec4-hovered={data.hovered === true}
      className={css({
        position: 'absolute',
        pointerEvents: 'none',
        left: '0',
        top: '0',
      })}
      style={{
        width: width,
        height: height,
        transformOrigin: '50% 0%',
        transform: `translate(-50%, ${top}px) translateX(${centerX}px) scale(${scale})`,
      }}
    >
      <m.div
        className={cx(
          elementNode(),
          css({
            pointerEvents: 'all',
            userSelect: 'none',
          }),
        )}
        variants={variants}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
        initial={'initial'}
        animate={isHovered ? 'hovered' : 'normal'}
        exit={'exit'}
        whileTap="tap"
        onHoverStart={() => {
          diagram.send({
            type: 'xyflow.nodeMouseEnter',
            node: node.data.id,
          })
        }}
        onHoverEnd={() => {
          diagram.send({
            type: 'xyflow.nodeMouseLeave',
            node: node.data.id,
          })
        }}
      >
        <ElementShape
          data={{
            width: data.width,
            height: data.height,
            shape: data.shape,
          }} />
        <ElementData data={omit(data, ['technology'])} />
      </m.div>
    </div>
  )
}
