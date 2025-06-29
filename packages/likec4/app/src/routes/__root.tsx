import { useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { useEffect } from 'react'

const asTheme = (v: unknown): 'light' | 'dark' | 'auto' => {
  if (typeof v !== 'string') {
    return 'auto'
  }
  const vlower = v.toLowerCase()
  if (vlower === 'light' || vlower === 'dark') {
    return vlower
  }
  return 'auto'
}

const asPadding = (v: unknown) => {
  switch (true) {
    case typeof v === 'number':
      return Math.round(v)
    case typeof v === 'string':
      return Math.round(parseFloat(v))
  }
  return 20
}

export type SearchParams = {
  theme?: 'light' | 'dark' | 'auto'
  padding?: number
}

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // validate and parse the search params into a typed state
    return {
      padding: asPadding(search.padding),
      theme: asTheme(search.theme),
    }
  },
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: 'auto',
      }),
    ],
  },
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <ThemeSync />
    </>
  )
}

const ThemeSync = () => {
  const { theme } = Route.useSearch()
  const mantineColorScheme = useMantineColorScheme()

  useEffect(() => {
    if (!theme) {
      return
    }
    if (theme !== mantineColorScheme.colorScheme) {
      mantineColorScheme.setColorScheme(theme)
    }
  }, [theme])

  return null
}
