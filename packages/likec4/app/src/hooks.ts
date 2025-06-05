import type { DiagramView, ProjectId } from '@likec4/core'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useParams } from '@tanstack/react-router'
import { shallowEqual } from 'fast-equals'
import { projects } from 'likec4:projects'
import { useEffect, useState } from 'react'
import { values } from 'remeda'
import { useLikeC4ModelDataAtom } from './context/LikeC4ModelContext'

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
  const $likec4data = useLikeC4ModelDataAtom()
  const [views, setViews] = useState([] as DiagramView[])
  useEffect(() => {
    return $likec4data.subscribe((next) => {
      setViews(prev => {
        const nextViews = values(next.views)
        if (shallowEqual(prev, nextViews)) {
          return prev
        }
        return nextViews
      })
    })
  }, [$likec4data])
  return views
}

export function useCurrentDiagram(): DiagramView | null {
  const viewId = useParams({
    select: (params) => params.viewId ?? 'index',
    strict: false,
  })
  const [view, setView] = useState<DiagramView | null>(null)

  const $likec4data = useLikeC4ModelDataAtom()

  useEffect(() => {
    return $likec4data.subscribe((next) => {
      setView(next.views[viewId] ?? null)
    })
  }, [$likec4data, viewId])

  return view
}

export function useCurrentProjectd(): ProjectId {
  const projectId = useParams({
    select: (params) => params.projectId,
    strict: false,
  })
  return (projectId ?? projects[0]) as ProjectId
}
