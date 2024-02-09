import { MantineProvider } from '@mantine/core'
import { Theme } from '@radix-ui/themes'
import { createRootRouteWithContext, Outlet, ScrollRestoration, useMatch, useMatchRoute } from '@tanstack/react-router'
import { Sidebar } from '../components'
import { theme } from '../theme'

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent
})

function RootComponent() {
  const match = useMatchRoute()
  const isTr = match({
    to: '/view/$viewId/editor'
    // from: '/view/$viewId'
  })
  // const match =
  return (
    <>
      <ScrollRestoration />
      <MantineProvider theme={theme} forceColorScheme="dark">
        <Theme
          appearance="dark"
          // hasBackground={!!Theme}
          accentColor="indigo"
          radius="small"
          // appearance={theme ?? 'inherit'}
        >
          <Outlet />
          {isTr && <Sidebar />}
        </Theme>
      </MantineProvider>
    </>
  )
}
