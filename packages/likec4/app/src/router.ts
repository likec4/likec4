// stores/router.ts
import { logger } from '@nanostores/logger'
import { useStore } from '@nanostores/react'
import { createSearchParams } from '@nanostores/router'
import { computed } from 'nanostores'

const $searchParams = createSearchParams()

const asTheme = (v: string | null | undefined) => {
  const vlower = v?.toLowerCase()
  if (vlower === 'light' || vlower === 'dark') {
    return vlower
  }
  return undefined
}

const asPadding = (v: string | null | undefined) => {
  const parsed = v ? parseFloat(v) : undefined
  if (parsed && isFinite(parsed) && isNaN(parsed) === false) {
    return Math.round(parsed)
  }
  return 20
}

const $route = computed($searchParams, v => {
  if ('embed' in v) {
    return {
      route: 'export' as const,
      params: {
        viewId: v.embed,
        padding: asPadding(v.padding),
        theme: asTheme(v.theme)
      },
      showUI: false
    }
  }
  if ('export' in v) {
    return {
      route: 'export' as const,
      params: {
        viewId: v.export,
        padding: asPadding(v.padding),
        theme: asTheme(v.theme)
      },
      showUI: false
    }
  }
  if ('view' in v) {
    return {
      route: 'view' as const,
      params: {
        viewId: v.view
      },
      showUI: 'showUI' in v ? v.showUI === 'true' : true
    }
  }
  return {
    route: 'index' as const,
    showUI: 'showUI' in v ? v.showUI === 'true' : true
  }
})

export const useRoute = () => useStore($route)
export type Route = NonNullable<ReturnType<typeof useRoute>>

export const isCurrentDiagram = <V extends { id: string }>(view: V) => {
  const r = $route.get()
  return (r.route === 'view' || r.route === 'export') && r.params.viewId === view.id
}

export const $pages = {
  index: {
    open: () => $searchParams.open({})
  },
  view: {
    open: (viewId: string) => $searchParams.open({ view: viewId })
  }
} as const

if (import.meta.env.DEV) {
  logger({
    $searchParams,
    $route
  })
}
