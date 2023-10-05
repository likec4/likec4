import type Konva from 'konva'
import { useEffect, useLayoutEffect, useRef, type PropsWithChildren } from 'react'
import { Group } from './konva'

type Props = PropsWithChildren<{
  selector: string
  enabled?: boolean
}>

/**
 * Original source:
 * https://github.com/konvajs/react-konva-utils
 *
 * Ported, because react-konva-utils loads whole konva
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
    const stage = outer.current.getStage()
    if (!stage) {
      return
    }

    if (shouldMove) {
      const newContainer = stage.findOne(selector)
      if (newContainer) {
        safeRef.current = inner.current
        inner.current.moveTo(newContainer)
      }
    } else if (safeRef.current) {
      safeRef.current.moveTo(outer.current)
      safeRef.current = undefined
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
    <Group ref={outer}>
      <Group ref={inner}>{children}</Group>
    </Group>
  )
}
