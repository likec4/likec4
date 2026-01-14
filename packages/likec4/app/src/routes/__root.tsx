import type { Fqn, NonEmptyArray, NonEmptyReadonlyArray, ProjectId } from '@likec4/core/types'
import { useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { projects } from 'likec4:projects'
import { useEffect } from 'react'
import { isTruthy, map } from 'remeda'
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

/**
 * Validates and normalizes a value as an FQN.
 * @param v - Value to validate from URL parameters
 * @returns Trimmed FQN string or undefined
 */
const asFqn = (v: unknown): Fqn | undefined => {
  if (typeof v === 'string') {
    const trimmed = v.trim()
    if (trimmed.length > 0) {
      return trimmed as Fqn
    }
  }
  return undefined
}

export type SearchParams = {
  theme?: 'light' | 'dark' | 'auto' | undefined
  dynamic?: 'diagram' | 'sequence' | undefined
  padding?: number | undefined
  relationships?: Fqn | undefined // Element FQN to open relationship browser
}

export type Context = {
  /**
   * Default (current) project
   */
  projectId: ProjectId

  /**
   * All projects
   */
  projects: NonEmptyReadonlyArray<ProjectId>
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
      ...isTruthy(search.relationships) && {
        relationships: asFqn(search.relationships),
      },
    }
  },
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: 'auto',
        dynamic: 'diagram',
        relationships: undefined,
      }),
    ],
  },
  beforeLoad: () => {
    const _projects = projects.length > 0
      ? map(projects, p => p.id)
      : ['default' as ProjectId] satisfies NonEmptyArray<ProjectId>
    return {
      projects: _projects,
      projectId: _projects[0],
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
