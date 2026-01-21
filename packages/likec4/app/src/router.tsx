import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { projects } from 'likec4:projects'
import { map } from 'remeda'
import { Fallback } from './components/Fallback'
import { NotFound } from './components/NotFound'
import { basepath, useHashHistory } from './const'
import { LikeC4ProjectsContext } from './context/LikeC4ProjectsContext'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

const router = createTanstackRouter<RouteTree, 'always', true>({
  routeTree,
  context: {
    projectId: projects[0].id,
    projects: map(projects, p => p.id),
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
