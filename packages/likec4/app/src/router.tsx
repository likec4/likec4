import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { useMemo } from 'react'
import { Fallback } from './components/Fallback'
import { NotFound } from './components/NotFound'
import { basepath, useHashHistory } from './const'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

function createRouter() {
  // const singleProjectIndex = createRouteMask({
  //   routeTree,
  //   unmaskOnReload: true,
  //   from: '/single-index',
  //   to: '/',
  // })

  return createTanstackRouter<RouteTree, 'always', true>({
    routeTree,
    context: {},
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
