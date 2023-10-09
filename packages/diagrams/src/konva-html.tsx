import type Konva from 'konva'
import type { HTMLAttributes, PropsWithChildren } from 'react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Group } from './konva'

function needForceStyle(el: HTMLDivElement) {
  const pos = window.getComputedStyle(el).position
  const ok = pos === 'absolute' || pos === 'relative'
  return !ok
}

export type HtmlTransformAttrs = {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  skewX: number
  skewY: number
}

type HtmlProps = PropsWithChildren<{
  groupProps?: Konva.ContainerConfig
  divProps?: HTMLAttributes<HTMLDivElement>
  transform?: boolean
  transformFunc?: (attrs: HtmlTransformAttrs) => HtmlTransformAttrs
}>

/**
 * Original source:
 * https://github.com/konvajs/react-konva-utils
 *
 * Ported because, imports from react-konva-utils loads whole konva
 */
export function KonvaHtml({ children, groupProps, divProps, transform, transformFunc }: HtmlProps) {
  const groupRef = useRef<Konva.Group>(null)

  const [div] = useState(() => document.createElement('div'))
  const root = useMemo(() => ReactDOM.createRoot(div), [div])

  const shouldTransform = transform ?? true

  const handleTransform = useCallback(() => {
    if (shouldTransform && groupRef.current) {
      const tr = groupRef.current.getAbsoluteTransform()
      let attrs = tr.decompose()
      if (transformFunc) {
        attrs = transformFunc(attrs)
      }
      div.style.position = 'absolute'
      div.style.zIndex = '10'
      div.style.top = '0px'
      div.style.left = '0px'
      div.style.transform = `translate(${attrs.x}px, ${attrs.y}px) rotate(${attrs.rotation}deg) scaleX(${attrs.scaleX}) scaleY(${attrs.scaleY})`
      div.style.transformOrigin = 'top left'
    } else {
      div.style.position = ''
      div.style.zIndex = ''
      div.style.top = ''
      div.style.left = ''
      div.style.transform = ``
      div.style.transformOrigin = ''
    }
    const { style, ...restProps } = divProps || {}
    // apply deep nesting, because direct assign of "divProps" will overwrite styles above
    Object.assign(div.style, style)
    Object.assign(div, restProps)
  }, [])

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) {
      return
    }
    const parent = group.getStage()?.container()
    if (!parent) {
      return
    }
    parent.appendChild(div)

    if (shouldTransform && needForceStyle(parent)) {
      parent.style.position = 'relative'
    }

    group.on('absoluteTransformChange', handleTransform)
    handleTransform()
    return () => {
      group.off('absoluteTransformChange', handleTransform)
      div.parentNode?.removeChild(div)
    }
  }, [shouldTransform])

  useLayoutEffect(() => {
    handleTransform()
  }, [divProps, transformFunc])

  useLayoutEffect(() => {
    root.render(children)
  })

  useLayoutEffect(() => {
    return () => {
      // I am not really sure why do we need timeout here
      // but it resolve warnings from react
      // ref: https://github.com/konvajs/react-konva-utils/issues/26
      setTimeout(() => {
        root.unmount()
      })
    }
  }, [])

  return <Group ref={groupRef} {...groupProps} />
}
