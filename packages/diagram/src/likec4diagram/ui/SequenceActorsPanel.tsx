import { type NodeId, BBox, ensureSizes } from '@likec4/core'
import { ifilter, imap, invariant, nonNullable, toArray } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { Box, Txt } from '@likec4/styles/jsx'
import { elementNode } from '@likec4/styles/recipes'
import { Panel } from '@xyflow/react'
import { type NodeReplaceChange, getNodeDimensions } from '@xyflow/system'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence, scale, useMotionTemplate, useMotionValue } from 'motion/react'
import * as m from 'motion/react-m'
import { useCallback, useEffect } from 'react'
import { clamp, filter, map, omit, pipe } from 'remeda'
import {
  type ElementTagsProps,
  CompoundDetailsButton,
  CompoundNodeContainer,
  CompoundTitle,
  DefaultHandles,
  ElementData,
  ElementDetailsButton,
  ElementNodeContainer,
  ElementShape,
  ElementTags as ElementTagsPrimitive,
} from '../../base-primitives'
import { PortalToContainer } from '../../custom'
import { useDiagram, useUpdateEffect, useXYStore } from '../../hooks'
import { selectDiagramActor } from '../../hooks/useDiagram'
import { selectXYStore, useXYStoreApi } from '../../hooks/useXYFlow'
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

      const maxY = xynode.data.ports.reduce((acc, port) => Math.max(acc, xynode.data.y + port.cy), -Infinity)

      const centerX = xynode.data.x + width / 2
      return (xynode.data.y + height) < y1
        && maxY > y1 + height + 30 &&
        (centerX - 30 > x1 && centerX + 30 < x2)
    }),
    imap(node => node.id),
    toArray(),
  )
})

/**
 * Shows sequence actors at the top of the diagram, if current viewport does not fit them
 */
export function SequenceActorsPanel() {
  const api = useXYStoreApi()
  const ids = useXYStore(selectActorNodes)
  const diagram = useDiagram()

  // useUpdateEffect(() => {
  //   const { nodes, triggerNodeChanges } = api.getState()
  //   const mustBeHidden = ids.length > 0

  //   const changes = pipe(
  //     nodes,
  //     filter(n => n.type === 'seq-actor' && (n.hidden ?? false) !== mustBeHidden),
  //     map((e): NodeReplaceChange<Types.AnyNode> => ({
  //       id: e.id,
  //       item: {
  //         ...e,
  //         hidden: mustBeHidden,
  //       },
  //       type: 'replace',
  //     })),
  //   )
  //   if (changes.length > 0) {
  //     triggerNodeChanges(changes)
  //   }
  //   // if (ids.length > 0) {
  //   //   const changes = pipe(
  //   //     nodes,
  //   //     filter(n => n.type === 'seq-actor' && n.hidden !== true),
  //   //     map((e): NodeReplaceChange<Types.AnyNode> => ({
  //   //       id: e.id,
  //   //       item: {
  //   //         ...e,
  //   //         hidden: true,
  //   //       },
  //   //       type: 'replace',
  //   //     })),
  //   //   )
  //   //   if (changes.length > 0) {
  //   //     triggerNodeChanges(changes)
  //   //   }
  //   //   return
  //   // }
  //   // const changes = pipe(
  //   //   nodes,
  //   //   filter(n => n.type === 'seq-actor' && n.hidden === true),
  //   //   map((e): NodeReplaceChange<Types.AnyNode> => ({
  //   //     id: e.id,
  //   //     item: {
  //   //       ...e,
  //   //       hidden: false,
  //   //     },
  //   //     type: 'replace',
  //   //   })),
  //   // )
  //   // if (changes.length > 0) {
  //   //   triggerNodeChanges(changes)
  //   // }
  // }, [ids])

  return (
    // <PortalToContainer>
    <AnimatePresence>
      {ids.map(id => <SequenceActor key={id} id={id} />)}
    </AnimatePresence>
  )
}

function SequenceActor({ id }: { id: string }) {
  const api = useXYStoreApi()
  // const centerX = useMotionValue(0)

  // useEffect(() => {
  //   return api.subscribe((state) => {
  //     const node = state.nodeLookup.get(id)
  //     if (!node) {
  //       return
  //     }
  //     const { width } = getNodeDimensions(node)
  //     const [tx, ty, tScale] = state.transform
  //     centerX.set(roundDpr((node.position.x + width / 2) * tScale + tx))
  //   })
  // }, [id, api, centerX])

  const { centerX, data, scale } = useXYStore(useCallback(state => {
    const node = nonNullable(state.nodeLookup.get(id))
    const { width, height } = getNodeDimensions(node)
    const [tx, ty, tScale] = state.transform

    const xynode = node.internals.userNode
    invariant(xynode.type === 'seq-actor')

    const newWidth = roundDpr(clamp(width * tScale, {
      min: 50,
      max: 150,
    }))

    const scale = clamp(0.5 * tScale, {
      min: 0.2,
      max: 0.6,
    })

    // const newHeight = roundDpr(height * scale)

    return {
      centerX: roundDpr((node.position.x + width / 2) * tScale + tx),
      data: xynode.data,
      scale,
      // width: newWidth,
      // height: newHeight,
      // scale: newWidth / width,
      // y: roundDpr((node.position.y - ty) * tScale),
    }
  }, [id]))

  const {
    size,
    padding,
    textSize,
  } = ensureSizes(data.style ?? {})

  return (
    <Box
      data-likec4-color={data.color}
      data-likec4-shape={data.shape}
      data-likec4-shape-size={size}
      data-likec4-spacing={padding}
      data-likec4-text-size={textSize}
      className={cx(
        elementNode(),
        'group',
        css({
          position: 'absolute',
          top: '[60px]',
          left: '0',
        }),
      )}
      style={{
        width: data.width,
        height: data.height,
        transformOrigin: '50% 0%',
        transform: `translateX(${centerX}px) translateX(-50%) scale(${scale})`,
      }}
    >
      <ElementShape
        data={{
          width: data.width,
          height: data.height,
          shape: data.shape,
        }} />
      <ElementData data={omit(data, ['technology'])} />
    </Box>
  )
  // <m.div
  //   key={id}
  //   layout="position"

  //   initial={{
  //     y: -20,
  //   }}
  //   animate={{
  //     y: 0,
  //   }}
  //   exit={{
  //     y: -20,
  //   }}
  //   style={{
  //     x: centerX,
  //   }}
  // >
  //   <Box p={'2'} bg="mantine.green">
  //     {id}
  //   </Box>
  // </m.div>
}
