import type { ProjectId } from '@likec4/core/types'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { basepath, useHashHistory } from 'likec4:app-config'
import { isSingleProject, projects } from 'likec4:projects'
import { hasAtLeast } from 'remeda'
import { NotFound } from './components/NotFound'
import { LikeC4ProjectsContext } from './context/LikeC4ProjectsContext'
import { rewriteSingleProjectInput, rewriteSingleProjectOutput } from './rewrite-single-project'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

const projectIds = projects.map(p => p.id)
const _projects = hasAtLeast(projectIds, 1)
  ? projectIds
  : ['default' as ProjectId] as const

// Snapshot once at router create; HMR 1↔2 project count changes are ignored.
const firstProjectId = _projects[0]
const rewriteOptions = {
  enabled: isSingleProject,
  firstProjectId,
}

const router = createTanstackRouter<RouteTree, 'always', true>({
  routeTree,
  context: {
    projectId: firstProjectId,
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
  ...(isSingleProject
    ? {
      rewrite: {
        input: ({ url }: { url: URL }) => rewriteSingleProjectInput(url, rewriteOptions),
        output: ({ url }: { url: URL }) => rewriteSingleProjectOutput(url, rewriteOptions),
      },
    }
    : {}),
})

declare module '@tanstack/react-router' {
  export interface Register {
    router: typeof router
  }
}

export function Routes() {
  return <RouterProvider router={router} />
}
