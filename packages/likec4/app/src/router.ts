// stores/router.ts
import { logger } from '@nanostores/logger'
import { useStore } from '@nanostores/react'
import { createSearchParams } from '@nanostores/router'
import { computed } from 'nanostores'

const $searchParams = createSearchParams()

const $route = computed($searchParams, v => {
  if ('export' in v || 'embed' in v) {
    return {
      route: 'export' as const,
      params: {
        viewId: v.export || v.embed,
        padding: 'padding' in v ? parseInt(v.padding) : 20
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
