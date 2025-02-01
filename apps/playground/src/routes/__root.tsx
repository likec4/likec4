import { useMantineColorScheme } from '@mantine/core'
import { useSyncedRef } from '@react-hookz/web'
import { createRootRouteWithContext, Outlet, ScrollRestoration } from '@tanstack/react-router'
import { memo, useEffect } from 'react'

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
  theme?: 'light' | 'dark' | undefined
  // padding: number | undefined
}

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      theme: asTheme(search['theme']),
    }
  },
})

function RootComponent() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      <ThemeSync />
    </>
  )
}

const ThemeSync = memo(() => {
  const { theme } = Route.useSearch()
  const m = useSyncedRef(useMantineColorScheme())

  useEffect(() => {
    if (!theme) {
      return
    }
    if (theme !== m.current.colorScheme) {
      m.current.setColorScheme(theme)
    }
  }, [theme])

  return null
})
