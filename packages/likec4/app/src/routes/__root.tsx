import { MantineProvider, useMantineColorScheme } from '@mantine/core'
import { Theme } from '@radix-ui/themes'
import { createRootRouteWithContext, Link, Outlet, ScrollRestoration } from '@tanstack/react-router'
import { DiagramNotFound } from '../components'
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

type SearchParams = {
  theme: 'light' | 'dark' | undefined
}

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // validate and parse the search params into a typed state
    return {
      theme: asTheme(search.theme)
    }
  },
  notFoundComponent: (props) => {
    return (
      <div>
        <p>Not found!</p>
        <Link to="/">Go home</Link>
      </div>
    )
  }
})

function RadixTheme({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useMantineColorScheme()
  const appearance = colorScheme === 'auto' ? 'inherit' : colorScheme
  return (
    <Theme
      appearance={appearance}
      accentColor="indigo"
      radius="small"
    >
      {children}
    </Theme>
  )
}

function RootComponent() {
  const { theme } = Route.useSearch()
  return (
    <>
      <ScrollRestoration />
      <MantineProvider
        {...(theme && { forceColorScheme: theme })}
        defaultColorScheme="dark"
        theme={mantineTheme}>
        <RadixTheme>
          <Outlet />
        </RadixTheme>
      </MantineProvider>
    </>
  )
}
