import type { DiagramView } from '@likec4/core/types'
import { useLikeC4Projects } from '@likec4/diagram'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useParams } from '@tanstack/react-router'
import { shallowEqual } from 'fast-equals'
import { useEffect, useState } from 'react'
import { useLikeC4ModelAtom } from './context/safeCtx'

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

export function useLikeC4Views(): ReadonlyArray<DiagramView> {
  const $likec4model = useLikeC4ModelAtom()
  const [views, setViews] = useState([] as DiagramView[])
  useEffect(() => {
    return $likec4model.subscribe((next) => {
      setViews(prev => {
        const nextViews = [...next.views()].map(v => v.$view)
        if (shallowEqual(prev, nextViews)) {
          return prev
        }
        return nextViews
      })
    })
  }, [$likec4model])
  return views
}

export function useCurrentViewId(): string {
  return useParams({
    select: (params) => params.viewId ?? 'index',
    strict: false,
  })
}

export function useCurrentDiagram(): DiagramView | null {
  const viewId = useCurrentViewId()
  const views = useLikeC4Views()
  return views.find(v => v.id === viewId) ?? null
}

export function useCurrentProject() {
  const projects = useLikeC4Projects()
  const projectId = useParams({
    select: (params) => params.projectId,
    strict: false,
  })
  return (projects.find(p => p.id === projectId) ?? projects[0]!)
}
