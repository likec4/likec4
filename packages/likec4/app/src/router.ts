import { useStore } from '@nanostores/react'
import { createSearchParams, createRouter, openPage, getPagePath } from '@nanostores/router'
import { computed } from 'nanostores'
import { BaseUrl } from './const'

export const $router = createRouter({
  index: BaseUrl,
  view: `${BaseUrl}view/:viewId?`,
  export: `${BaseUrl}export/:viewId`,
  embed: `${BaseUrl}embed/:viewId`
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
        viewId: r.params.viewId ?? 'index',
        theme: asTheme(v.theme) ?? 'dark'
      },
      showUI: 'showUI' in v ? v.showUI === 'true' : true
    }
  }
  if (r?.route === 'export' || r?.route === 'embed') {
    return {
      route: r.route,
      params: {
        viewId: r.params.viewId,
        padding: asPadding(v.padding),
        theme: r.route === 'embed' ? asTheme(v.theme) : undefined
      },
      showUI: false
    }
  }
  return {
    route: 'index' as const,
    params: {
      theme: asTheme(v.theme) ?? 'dark'
    },
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
  },
  embed: {
    path: (viewId: string) => getPagePath($router, 'embed', { viewId })
  }
} as const

// if (import.meta.env.DEV) {
//   logger({
//     $searchParams,
//     $router,
//     $route
//   })
// }
