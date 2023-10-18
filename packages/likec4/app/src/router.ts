// stores/router.ts
import { logger } from '@nanostores/logger'
import { useStore } from '@nanostores/react'
import { createSearchParams, createRouter, openPage } from '@nanostores/router'
import { computed } from 'nanostores'

let BASE = import.meta.env.BASE_URL
if (!BASE.endsWith('/')) {
  BASE = BASE + '/'
}

export const $router = createRouter({
  index: BASE,
  view: `${BASE}view/:viewId?`,
  export: `${BASE}export/:viewId`,
  embed: `${BASE}embed/:viewId`
} as const)

const $searchParams = createSearchParams()

const asTheme = (v: string | null | undefined): 'light' | 'dark' | undefined => {
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

const $route = computed([$router, $searchParams], (r, v) => {
  if (r?.route === 'view') {
    return {
      route: 'view' as const,
      params: {
        viewId: r.params.viewId ?? 'index'
      },
      showUI: 'showUI' in v ? v.showUI === 'true' : true
    }
  }
  if (r?.route === 'export' || r?.route === 'embed') {
    return {
      route: 'export' as const,
      params: {
        viewId: r.params.viewId,
        padding: asPadding(v.padding),
        theme: asTheme(v.theme)
      },
      showUI: false
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
    open: () => openPage($router, 'index')
  },
  view: {
    open: (viewId: string) => openPage($router, 'view', { viewId })
  }
} as const

if (import.meta.env.DEV) {
  logger({
    $searchParams,
    $router,
    $route
  })
}
