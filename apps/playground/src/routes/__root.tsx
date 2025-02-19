import { useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

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
