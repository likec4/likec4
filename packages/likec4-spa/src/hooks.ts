import type { LikeC4Model } from '@likec4/core/model'
import type { LayoutedView, LayoutType, ViewId } from '@likec4/core/types'
import type { ProjectDiffs } from 'likec4:diffs'
import type { ReadableAtom } from 'nanostores'
import { useStore } from '@nanostores/react'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { type Project, useLikeC4Projects } from 'likec4:projects'
import { atom } from 'nanostores'
import { useMemo } from 'react'
import { useLikeC4ProjectContext, useLikeC4ViewContext, useOptionalLikeC4ViewContext } from './context/safeCtx'

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

/**
 * Returns the model of the current project.
 * Re-renders on every change of the model: prefer a narrower atom where possible.
 */
export function useProjectModel(): LikeC4Model.Layouted {
  return useStore(useLikeC4ProjectContext().$model)
}

/**
 * Returns the diffs of the current project with their compare views
 */
export function useModelDiffs(): ProjectDiffs {
  return useStore(useLikeC4ProjectContext().$diffs)
}

export function useLikeC4Views(): ReadonlyArray<LayoutedView> {
  const model = useProjectModel()
  return useMemo(() => [...model.views()].map(v => v.$layouted), [model])
}

export function useCurrentViewId(): ViewId {
  return useStore(useLikeC4ViewContext().$viewId)
}

/**
 * Returns the current view and a function to set the layout type.
 */
export function useCurrentView(): [LayoutedView | null, (layoutType: LayoutType) => void] {
  const { $view, setLayoutType } = useLikeC4ViewContext()
  return [useStore($view), setLayoutType]
}

const $noView: ReadableAtom<LayoutedView | null> = atom(null)

/**
 * Returns the current view, or null outside of a view (for example, on the project index page)
 */
export function useOptionalCurrentView(): LayoutedView | null {
  return useStore(useOptionalLikeC4ViewContext()?.$view ?? $noView)
}

export function useCurrentProject(): Project {
  const { projectId } = useLikeC4ProjectContext()
  const projects = useLikeC4Projects()
  return projects.find(p => p.id === projectId) ?? projects[0]
}
