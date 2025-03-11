import type { DiagramView, ProjectId } from '@likec4/core'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useParams } from '@tanstack/react-router'
import { nano } from 'likec4/react'
import { useMemo } from 'react'
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
  const $likec4data = useLikeC4ModelDataContext()
  const $viewAtom = useMemo(() => {
    return nano.computed($likec4data, (model) => model.views[viewId] ?? null)
  }, [viewId, $likec4data])
  return nano.useStore($viewAtom)
}

export function useCurrentProjectd(): ProjectId {
  const projectId = useParams({
    select: (params) => params.projectId,
    strict: false,
  })
  return (projectId ?? projects[0]) as ProjectId
}
