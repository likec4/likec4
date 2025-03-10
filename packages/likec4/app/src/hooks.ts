import type { DiagramView, ProjectId } from '@likec4/core'
import { useIsomorphicLayoutEffect, useRerender } from '@react-hookz/web'
import { useParams } from '@tanstack/react-router'
import { deepEqual } from 'fast-equals'
import { useEffect, useRef } from 'react'
import { projects } from 'virtual:likec4/projects'
import { useLikeC4ModelDataContext } from './context/LikeC4ModelContext'

// To get the transparent background
// We need to add a class to the HTML element
export function useTransparentBackground(enabled = true) {
  useIsomorphicLayoutEffect(() => {
    const htmlEl = document.body.parentElement
    if (!htmlEl || enabled !== true) return
    // see ../../likec4.css
    const classname = 'transparent-bg'
    htmlEl.classList.add(classname)
    return () => {
      htmlEl.classList.remove(classname)
    }
  }, [enabled])
}

export function useCurrentDiagram(): DiagramView | null {
  const viewId = useParams({
    select: (params) => params.viewId ?? 'index',
    strict: false,
  })
  const rerender = useRerender()
  const $likec4data = useLikeC4ModelDataContext()
  const diagramRef = useRef<DiagramView | null>(null)
  diagramRef.current = $likec4data?.get().views[viewId] ?? null

  useEffect(() => {
    if (!viewId || !$likec4data) return
    return $likec4data.subscribe((update) => {
      const newview = update.views[viewId] ?? null
      if (!deepEqual(newview, diagramRef.current)) {
        rerender()
      }
    })
  }, [$likec4data, viewId])

  return diagramRef.current
}

export function useCurrentProjectd(): ProjectId {
  const projectId = useParams({
    select: (params) => params.projectId,
    strict: false,
  })
  return (projectId ?? projects[0]) as ProjectId
}
