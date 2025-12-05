import type { ProjectId } from '@likec4/core/types'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { Fallback } from './components/Fallback'
import { NotFound } from './components/NotFound'
import { basepath, useHashHistory } from './const'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

const router = createTanstackRouter<RouteTree, 'always', true>({
  routeTree,
  context: {
    projectId: 'default' as ProjectId,
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

declare module '@tanstack/react-router' {
  export interface Register {
    router: typeof router
  }
}

export function Routes() {
  return <RouterProvider router={router} />
}
