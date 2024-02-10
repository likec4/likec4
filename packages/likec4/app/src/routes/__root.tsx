import { MantineProvider, useMantineColorScheme } from '@mantine/core'
import { Theme } from '@radix-ui/themes'
import {
  createRootRouteWithContext,
  Outlet,
  ScrollRestoration,
  useChildMatches,
  useMatch,
  useMatchRoute,
  useSearch
} from '@tanstack/react-router'
import { findLast } from 'remeda'
import { Sidebar } from '../components'
import { theme as mantineTheme } from '../theme'

// const searchParams = computed($searchParams, v => {
//   return {
//     theme: asTheme(v.theme),
//     padding: asPadding(v.padding),
//     mode: asViewMode(v.mode),
//     showUI: 'showUI' in v ? v.showUI === 'true' : undefined
//   }

// })

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
  const match = useChildMatches({
    select: (r) => {
      return findLast(r, (m) => 'viewId' in m.params)
    }
  })
  return (
    <>
      <ScrollRestoration />
      <MantineProvider
        {...(theme && { forceColorScheme: theme })}
        defaultColorScheme="dark"
        theme={mantineTheme}>
        <RadixTheme>
          <Outlet />
          {match && <Sidebar />}
        </RadixTheme>
      </MantineProvider>
    </>
  )
}
