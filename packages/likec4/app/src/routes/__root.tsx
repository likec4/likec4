import type { NonEmptyArray, ProjectId } from '@likec4/core/types'
import { MantineProvider } from '@mantine/core'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { projects } from 'likec4:projects'
import { map } from 'remeda'
import { resolveForceColorScheme, searchParamsSchema } from '../searchParams'
import { theme as mantineTheme } from '../theme'

export type Context = {
  /**
   * Default (current) project
   */
  projectId: ProjectId

  /**
   * All projects
   */
  projects: readonly [ProjectId, ...ProjectId[]]
}

export const Route = createRootRouteWithContext<Context>()({
  validateSearch: searchParamsSchema,
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: undefined,
        dynamic: 'diagram',
        relationships: undefined,
      }),
    ],
  },
  beforeLoad: (): Context => {
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
  const { theme } = Route.useSearch()
  // When ?theme= is explicitly set in URL, force that color scheme without
  // writing to localStorage. This preserves the user's manual preference
  // while allowing embeds to override the appearance via URL.
  const forceColorScheme = resolveForceColorScheme(theme)
  return (
    <MantineProvider
      theme={mantineTheme}
      defaultColorScheme="auto"
      {...(forceColorScheme && { forceColorScheme })}
    >
      <Outlet />
    </MantineProvider>
  )
}
