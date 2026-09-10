import type { NonEmptyArray, ProjectId } from '@likec4/core/types'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { basepath, useHashHistory } from 'likec4:app-config'
import { projects } from 'likec4:projects'
import { map } from 'remeda'
import { NotFound } from './components/NotFound'
import { LikeC4ProjectsContext } from './context/LikeC4ProjectsContext'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

const _projects = projects.length > 0
  ? map(projects, p => p.id)
  : ['default' as ProjectId] satisfies NonEmptyArray<ProjectId>

const router = createTanstackRouter<RouteTree, 'always', true>({
  routeTree,
  context: {
    projectId: _projects[0],
    projects: _projects,
  },
  InnerWrap: LikeC4ProjectsContext,
  basepath,
  trailingSlash: 'always',
  defaultViewTransition: false,
  history: useHashHistory ? createHashHistory() : createBrowserHistory(),
  defaultStaleTime: Infinity,
  defaultNotFoundComponent: () => {
    return <NotFound />
  },
})

declare module '@tanstack/react-router' {
  export interface Register {
    router: typeof router
  }
}

export function Routes() {
  return <RouterProvider router={router} />
}
