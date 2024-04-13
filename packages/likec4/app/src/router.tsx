// import { useStore } from '@nanostores/react'
// import type { ConfigFromRouter, ParamsArg } from '@nanostores/router'
// import { createRouter, createSearchParams, getPagePath } from '@nanostores/router'
// import { computed } from 'nanostores'
// import { equals, isEmpty, isString, mapValues, omitBy } from 'remeda'
// import type { ViewID } from '@likec4/core'
// import { BaseUrl } from './const'
// import { startTransition } from 'react'
import { createRouter as createTanstackRouter, RouterProvider } from '@tanstack/react-router'

import { NotFound } from './components/NotFound'

import { useMemo } from 'react'
import { routeTree } from './routeTree.gen'

// const notFoundRoute = new NotFoundRoute({
//   getParentRoute: () => rootRoute,
//   component: () => <div className="p-2">Not Found</div>,
// })
function createRouter(basepath: string) {
  return createTanstackRouter({
    routeTree,
    context: {},
    basepath,
    // defaultErrorComponent
    // defaultPendingMinMs: 600,
    // defaultPendingMs: 300,
    defaultPreload: false,
    defaultNotFoundComponent: () => {
      return <NotFound />
    }
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

export function Routes({ basepath }: { basepath: string }) {
  const router = useMemo(() => createRouter(basepath), [basepath])
  return <RouterProvider router={router} />
  // ReactDOM.createRoot(document.getElementById('like4-root')!).render(
  //   <RouterProvider router={router} />
  // )
}
