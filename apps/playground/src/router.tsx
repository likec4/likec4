import { createRouter as createTanstackRouter, RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import { NotFound } from './components/NotFound'
import { basepath } from './const'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

function createRouter() {
  return createTanstackRouter<RouteTree, 'always', true>({
    routeTree,
    context: {},
    basepath,
    trailingSlash: 'always',
    // history: useHasHistory ? createHashHistory() : createBrowserHistory(),
    // defaultErrorComponent
    // defaultPendingMinMs: 600,
    // defaultPendingMs: 300,
    defaultPreload: false,
    defaultNotFoundComponent: () => {
      return <NotFound />
    },
    // defaultPreloadDelay: 200,

    // defaultPendingComponent: () => (
    //   <Box p={'md'}>
    //     <Loader type="dots" />
    //   </Box>
    // ),

    // defaultStaleTime: 60_000, // 1 minute
    // defaultPreloadStaleTime: 60_000 // 1 minute
    // Since we're using React Query, we don't want loader calls to ever be stale
    // This will ensure that the loader is always called when the route is preloaded or visited
    // defaultPreloadStaleTime: 0,
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
