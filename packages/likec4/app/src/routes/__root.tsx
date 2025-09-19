import type { ProjectId } from '@likec4/core/types'
import { useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { isTruthy } from 'remeda'
import { LikeC4ProjectsContext } from '../context/LikeC4ProjectsContext'

const asTheme = (v: unknown): 'light' | 'dark' | 'auto' => {
  if (typeof v !== 'string') {
    return 'auto'
  }
  const vlower = v.toLowerCase()
  if (vlower === 'light' || vlower === 'dark') {
    return vlower
  }
  return 'auto'
}

const asPadding = (v: unknown) => {
  switch (true) {
    case typeof v === 'number':
      return Math.round(v)
    case typeof v === 'string':
      return Math.round(parseFloat(v))
  }
  return 20
}

const asDynamicVariant = (v: unknown): 'diagram' | 'sequence' => {
  if (typeof v !== 'string') {
    return 'diagram'
  }
  const vlower = v.toLowerCase()
  if (vlower === 'diagram' || vlower === 'sequence') {
    return vlower
  }
  return 'diagram'
}

export type SearchParams = {
  theme?: 'light' | 'dark' | 'auto'
  dynamicVariant?: 'diagram' | 'sequence'
  padding?: number
}

type Context = {
  /**
   * Default project
   */
  projectId: ProjectId
}

export const Route = createRootRouteWithContext<Context>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // validate and parse the search params into a typed state
    return {
      ...isTruthy(search.padding) && {
        padding: asPadding(search.padding),
      },
      ...isTruthy(search.theme) && {
        theme: asTheme(search.theme),
      },
      ...isTruthy(search.dynamicVariant) && {
        dynamicVariant: asDynamicVariant(search.dynamicVariant),
      },
    }
  },
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: 'auto',
        dynamicVariant: 'diagram',
      }),
    ],
  },
})

function RootComponent() {
  return (
    <LikeC4ProjectsContext>
      <Outlet />
      <ThemeSync />
    </LikeC4ProjectsContext>
  )
}

const ThemeSync = () => {
  const { theme } = Route.useSearch()
  const mantineColorScheme = useMantineColorScheme()

  useEffect(() => {
    if (!theme) {
      return
    }
    mantineColorScheme.setColorScheme(theme)
  }, [theme])

  return null
}
