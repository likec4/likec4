import { MantineProvider } from '@mantine/core'
import { createRootRouteWithContext, Outlet, ScrollRestoration } from '@tanstack/react-router'
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

const asPadding = (v: unknown) => {
  switch (true) {
    case typeof v === 'number':
      return Math.round(v)
    case typeof v === 'string':
      return Math.round(parseFloat(v))
  }
  return undefined
}

export type SearchParams = {
  theme?: 'light' | 'dark' | undefined
  padding?: number | undefined
}

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // validate and parse the search params into a typed state
    return {
      padding: asPadding(search.padding),
      theme: asTheme(search.theme)
    }
  }
})

function RootComponent() {
  const { theme } = Route.useSearch()
  return (
    <MantineProvider
      {...(theme && { forceColorScheme: theme })}
      defaultColorScheme={theme ?? 'auto'}
      theme={mantineTheme}>
      <ScrollRestoration />
      <Outlet />
    </MantineProvider>
  )
}
