import { Box, Loader } from '@mantine/core'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider
} from '@tanstack/react-router'
import { useMemo } from 'react'
import { NotFound } from './components/NotFound'
import { basepath, useHashHistory } from './const'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

function createRouter() {
  return createTanstackRouter<RouteTree, 'preserve'>({
    routeTree,
    context: {},
    basepath,
    trailingSlash: 'preserve',
    history: useHashHistory ? createHashHistory() : createBrowserHistory(),
    defaultStaleTime: Infinity,
    defaultNotFoundComponent: () => {
      return <NotFound />
    },
    defaultPendingComponent: () => (
      <Box p={'md'}>
        <Loader type="dots" />
      </Box>
    )
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
