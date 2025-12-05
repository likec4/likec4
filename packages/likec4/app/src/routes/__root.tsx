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
  dynamic?: 'diagram' | 'sequence'
  padding?: number
}

export type Context = {
  /**
   * Default project
   */
  projectId: ProjectId
}

export const Route = createRootRouteWithContext<Context>()({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // validate and parse the search params into a typed state
    return {
      ...isTruthy(search.padding) && {
        padding: asPadding(search.padding),
      },
      ...isTruthy(search.theme) && {
        theme: asTheme(search.theme),
      },
      ...isTruthy(search.dynamic) && {
        dynamic: asDynamicVariant(search.dynamic),
      },
    }
  },
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: 'auto',
        dynamic: 'diagram',
      }),
    ],
  },
  beforeLoad: async () => {
    const { projects } = await import('likec4:projects')
    return {
      projectId: projects.length > 0 ? projects[0].id : 'default' as ProjectId,
    }
  },
  component: RootComponent,
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
