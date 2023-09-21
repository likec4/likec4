import type Konva from 'konva'
import { useRef, type PropsWithChildren, useLayoutEffect, useEffect } from 'react'
import { Group } from './konva'

type Props = PropsWithChildren<{
  selector: string
  enabled?: boolean
}>

/**
 * Original source:
 * https://github.com/konvajs/react-konva-utils
 *
 * Ported because, imports from react-konva-utils loads whole konva
 */
// make a portal implementation
export const Portal = ({ selector, enabled, children }: Props) => {
  // "selector" is a string to find another container to insert all internals
  // if can be like ".top-layer" or "#overlay-group"
  const outer = useRef<Konva.Group>(null)
  const inner = useRef<Konva.Group>(null)

  const safeRef = useRef<Konva.Group>()
  const shouldMove = enabled ?? true

  useLayoutEffect(() => {
    if (!outer.current || !inner.current) {
      return
    }
    safeRef.current = inner.current
    const stage = outer.current.getStage() as Konva.Stage
    const newContainer = stage.findOne(selector)
    if (shouldMove && newContainer) {
      inner.current.moveTo(newContainer)
    } else {
      inner.current.moveTo(outer.current)
    }
  }, [selector, shouldMove])

  useEffect(() => {
    return () => {
      // manually destroy
      safeRef.current?.destroy()
    }
  }, [])

  // for smooth movement we will have to use two group
  // outer - is main container, will be placed on old position
  // inner - that we will move into another container
  return (
    <Group name='_outer_portal' ref={outer}>
      <Group name='_inner_portal' ref={inner}>
        {children}
      </Group>
    </Group>
  )
}
