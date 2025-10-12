import type { LayoutedView, LayoutType } from '@likec4/core/types'
import { useLikeC4Projects, useUpdateEffect } from '@likec4/diagram'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useParams } from '@tanstack/react-router'
import { deepEqual, shallowEqual } from 'fast-equals'
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

export function useLikeC4Views(): ReadonlyArray<LayoutedView> {
  const $likec4model = useLikeC4ModelAtom()
  const [views, setViews] = useState([] as LayoutedView[])
  useEffect(() => {
    return $likec4model.subscribe((next) => {
      setViews(prev => {
        const nextViews = [...next.views()].map((v) => {
          const n = v.$layouted
          const p = prev.find(_ => _.id === v.id)
          return !!p && deepEqual(n, p) ? p : n
        })
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

export function useCurrentView(): [LayoutedView | null, (layoutType: LayoutType) => void] {
  const viewId = useCurrentViewId()
  const $likec4model = useLikeC4ModelAtom()
  const [layoutType, setLayoutType] = useState('manual' as LayoutType)

  useUpdateEffect(() => {
    setLayoutType('manual')
  }, [viewId])

  const [view, setView] = useState($likec4model.value?.findView(viewId)?.$layouted ?? null)
  useEffect(() => {
    return $likec4model.subscribe((next) => {
      setView(current => {
        const vm = next.findView(viewId)
        const nextView = (layoutType === 'manual' ? vm?.$layouted : vm?.$view) ?? null
        if (deepEqual(current, nextView)) {
          return current
        }
        return nextView
      })
    })
  }, [$likec4model, viewId, layoutType])

  return [view, setLayoutType] as const
}

export function useCurrentProject() {
  const projects = useLikeC4Projects()
  const projectId = useParams({
    select: (params) => params.projectId,
    strict: false,
  })
  return (projects.find(p => p.id === projectId) ?? projects[0]!)
}
