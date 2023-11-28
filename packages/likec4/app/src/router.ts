import { useStore } from '@nanostores/react'
import type { ConfigFromRouter, ParamsArg } from '@nanostores/router'
import { createRouter, createSearchParams, getPagePath } from '@nanostores/router'
import { computed } from 'nanostores'
import { equals, mapValues, omitBy } from 'remeda'
import type { ViewID } from '~likec4'
import { BaseUrl } from './const'
import { startTransition } from 'react'

export const $router = createRouter(
  {
    index: BaseUrl,
    view: `${BaseUrl}view/:viewId?`,
    export: `${BaseUrl}export/:viewId`,
    embed: `${BaseUrl}embed/:viewId`
  },
  {
    links: true
  }
)
type Config = ConfigFromRouter<typeof $router>

const $searchParams = createSearchParams({
  links: true
})

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
  return undefined
}

export type ViewMode = 'react' | 'dot' | 'mmd' | 'd2'
const asViewMode = (v: string | null | undefined): ViewMode | undefined => {
  const mode = v?.toLowerCase() ?? ''
  switch (mode) {
    case 'dot':
    case 'mmd':
    case 'd2':
    case 'react': {
      return mode
    }
    default: {
      return undefined
    }
  }
}

const searchParams = computed($searchParams, v => {
  return {
    theme: asTheme(v.theme),
    padding: asPadding(v.padding),
    mode: asViewMode(v.mode),
    showUI: 'showUI' in v ? v.showUI === 'true' : undefined
  }
})
type SearchParams = NonNullable<(typeof searchParams)['value']>
// type SearchParamsWithoutDefaults = {
//   [K in keyof SearchParams]: Exclude<SearchParams[K], undefined>
// }

const omitDefaults = omitBy<SearchParams>((v, k) => {
  return (
    v == undefined ||
    (k === 'theme' && v === 'dark') ||
    (k === 'mode' && v === 'react') ||
    (k === 'padding' && v === 20)
  )
})

export function updateSearchParams(update: Partial<SearchParams>) {
  const current = searchParams.get()
  const next = {
    ...current,
    ...update
  }
  if (!equals(current, next)) {
    const params = mapValues(omitDefaults(next), v => v?.toString() ?? '')
    startTransition(() => {
      $searchParams.open(params)
    })
  }
}
export const useSearchParams = () => useStore(searchParams)

const $route = computed([$router, searchParams], (r, v) => {
  if (r?.route === 'view') {
    return {
      route: 'view' as const,
      params: {
        viewId: (r.params.viewId ?? 'index') as ViewID,
        theme: v.theme ?? 'dark',
        mode: v.mode ?? 'react'
      },
      showUI: v.showUI ?? true
    }
  }
  if (r?.route === 'export' || r?.route === 'embed') {
    return {
      route: r.route,
      params: {
        viewId: r.params.viewId as ViewID,
        padding: v.padding ?? 20,
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
    showUI: v.showUI ?? false
  }
})

export const useRoute = () => useStore($route)
export type Route = NonNullable<ReturnType<typeof useRoute>>

export const isCurrentDiagram = <V extends { id: string }>(view: V) => {
  const r = $route.get()
  return (
    (r.route === 'view' || r.route === 'export' || r.route === 'embed') &&
    r.params.viewId === view.id
  )
}

function currentSearchParams() {
  const params = omitDefaults(searchParams.get())
  const urlSearchParams = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) {
      urlSearchParams.set(k, v.toString())
    }
  }
  const asString = urlSearchParams.toString()
  return asString !== '' ? '?' + asString : ''
}

function getRoutePath<PageName extends keyof Config>(
  name: PageName,
  ...params: ParamsArg<Config, PageName>
): string {
  // if (params.length > 1) {
  //   let p = params[0]!
  //   p.
  // }
  return getPagePath($router, name, ...params) + currentSearchParams()
}

function openRoute<PageName extends keyof Config>(
  name: PageName,
  ...params: ParamsArg<Config, PageName>
) {
  startTransition(() => {
    $router.open(getRoutePath(name, ...params))
  })
}

export const $pages = {
  index: {
    url: () => getRoutePath('index'),
    open: () => openRoute('index')
  },
  view: {
    url: (viewId: ViewID) => getRoutePath('view', { viewId }),
    open: (viewId: ViewID) => openRoute('view', { viewId })
  },
  embed: {
    path: (viewId: ViewID) => getRoutePath('embed', { viewId })
  }
} as const

// if (import.meta.env.DEV) {
//   logger({
//     $searchParams,
//     $router,
//     $route
//   })
// }
