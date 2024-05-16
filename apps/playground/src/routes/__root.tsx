import { MantineProvider, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Link, Outlet, ScrollRestoration } from '@tanstack/react-router'
import { theme as mantineTheme } from '../theme'

const asTheme = (v: unknown): 'light' | 'dark' | undefined => {
  if (typeof v !== 'string') {
    return undefined
  }
  const vlower = v.toLowerCase()
  if (vlower === 'light' || vlower === 'dark') {
    return vlower
  }
  return undefined
}

export type SearchParams = {
  theme: 'light' | 'dark' | undefined
  // padding: number | undefined
}

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      theme: asTheme(search['theme'])
    }
  }
})

function RootComponent() {
  const { theme } = Route.useSearch()
  return (
    <MantineProvider
      {...(theme && { forceColorScheme: theme })}
      defaultColorScheme="dark"
      theme={mantineTheme}>
      <ScrollRestoration />
      <Outlet />
    </MantineProvider>
  )
}
