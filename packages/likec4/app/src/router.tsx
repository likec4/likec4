import { MantineProvider } from '@mantine/core'
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { useMemo } from 'react'
import { NotFound } from './components/NotFound'
import { basepath, useHashHistory } from './const'
import { routeTree } from './routeTree.gen'
import { theme as mantineTheme } from './theme'

type RouteTree = typeof routeTree

function createRouter() {
  return createTanstackRouter<RouteTree, 'preserve', true>({
    routeTree,
    context: {},
    basepath,
    trailingSlash: 'preserve',
    history: useHashHistory ? createHashHistory() : createBrowserHistory(),
    defaultStaleTime: Infinity,
    defaultNotFoundComponent: () => {
      return <NotFound />
    },
    // defaultPendingComponent: () => (
    //   <Box p={'md'}>
    //     <Loader type="dots" />
    //   </Box>
    // )
  })
}

declare module '@tanstack/react-router' {
  export interface Register {
    router: ReturnType<typeof createRouter>
  }
}

export function Routes() {
  const router = useMemo(() => createRouter(), [])
  const { theme } = router.parseLocation().search
  return (
    <MantineProvider
      {...(theme && { forceColorScheme: theme })}
      defaultColorScheme={theme ?? 'auto'}
      theme={mantineTheme}>
      <RouterProvider router={router} />
    </MantineProvider>
  )
}
