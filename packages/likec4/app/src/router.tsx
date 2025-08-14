import type { ProjectId } from '@likec4/core/types'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { projects } from 'likec4:projects'
import { useMemo } from 'react'
import { Fallback } from './components/Fallback'
import { NotFound } from './components/NotFound'
import { basepath, useHashHistory } from './const'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

function createRouter() {
  return createTanstackRouter<RouteTree, 'always', true>({
    routeTree,
    context: {
      projectId: projects.length > 0 ? projects[0].id : 'default' as ProjectId,
    },
    basepath,
    trailingSlash: 'always',
    defaultViewTransition: true,
    history: useHashHistory ? createHashHistory() : createBrowserHistory(),
    defaultStaleTime: Infinity,
    scrollRestoration: false,
    defaultStructuralSharing: true,
    defaultNotFoundComponent: () => {
      return <NotFound />
    },
    defaultErrorComponent: ({ error, reset }) => {
      return <Fallback error={error} resetErrorBoundary={reset} />
    },
  })
}

declare module '@tanstack/react-router' {
  export interface Register {
    router: ReturnType<typeof createRouter>
  }
}

export function Routes() {
  const router = useMemo(() => createRouter(), [])
  return <RouterProvider router={router} />
}
