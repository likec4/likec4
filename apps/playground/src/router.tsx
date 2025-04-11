import { Box, Button, Code, Group, Notification, ScrollAreaAutosize } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { createRouter as createTanstackRouter, RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { NotFound } from './components/NotFound'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorString = error instanceof Error ? error.message : 'Unknown error'
  return (
    <Box pos={'fixed'} top={0} left={0} w={'100%'} p={0} style={{ zIndex: 1000 }}>
      <Notification
        icon={<IconX style={{ width: 16, height: 16 }} />}
        styles={{
          icon: {
            alignSelf: 'flex-start',
          },
        }}
        color={'red'}
        title={'Oops, something went wrong'}
        p={'xl'}
        withCloseButton={false}>
        <ScrollAreaAutosize maw={'100%'} mah={400}>
          <Code block>{errorString}</Code>
        </ScrollAreaAutosize>
        <Group gap={'xs'} mt="xl">
          <Button color="gray" size="xs" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
        </Group>
      </Notification>
    </Box>
  )
}

function createRouter() {
  return createTanstackRouter<RouteTree, 'always', true>({
    routeTree,
    context: {},
    basepath: import.meta.env.BASE_URL,
    trailingSlash: 'always',
    // history: useHasHistory ? createHashHistory() : createBrowserHistory(),
    defaultErrorComponent: ({ error, reset }) => {
      return <Fallback error={error} resetErrorBoundary={reset} />
    },
    defaultViewTransition: true,
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
