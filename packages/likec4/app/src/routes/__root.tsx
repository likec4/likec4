import type { Fqn, NonEmptyArray, ProjectId } from '@likec4/core/types'
import { useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { projects } from 'likec4:projects'
import { useEffect } from 'react'
import { map } from 'remeda'
import z from 'zod/v4'

const searchParamsSchema = z.object({
  theme: z.literal(['light', 'dark', 'auto'])
    .default('auto')
    .catch('auto'),
  dynamic: z.enum(['diagram', 'sequence'])
    .default('diagram')
    .catch('diagram'),
  padding: z.number()
    .min(0)
    .default(20)
    .catch(20),
  relationships: z.string()
    .nonempty()
    .optional()
    .catch(undefined)
    .transform(v => v as Fqn | undefined),
})

export type SearchParams = z.infer<typeof searchParamsSchema>

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
        theme: 'auto',
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
  return (
    <>
      <Outlet />
      <ThemeSync />
    </>
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
