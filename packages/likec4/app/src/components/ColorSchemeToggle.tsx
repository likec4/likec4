import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { IconMoonStars, IconSun } from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Route as rootRoute } from '../routes/__root'
import { resolveForceColorScheme } from '../searchParams'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  })
  const computedColorScheme = useComputedColorScheme('light')
  const navigate = useNavigate()
  const { theme: urlTheme } = rootRoute.useSearch()

  const isForced = resolveForceColorScheme(urlTheme) != null

  // When forceColorScheme is active, Mantine ignores setColorScheme calls.
  // To toggle we first navigate to remove ?theme= (clearing forceColorScheme),
  // then apply the desired scheme once React re-renders without the force.
  const pendingScheme = useRef<'light' | 'dark' | null>(null)

  useEffect(() => {
    if (pendingScheme.current != null && !isForced) {
      setColorScheme(pendingScheme.current)
      pendingScheme.current = null
    }
  }, [isForced, setColorScheme])

  const toggle = () => {
    // Guard against rapid double-clicks while a navigate is still pending
    if (pendingScheme.current != null) return
    const next = computedColorScheme === 'light' ? 'dark' : 'light'
    if (isForced) {
      pendingScheme.current = next
      navigate({
        from: rootRoute.fullPath,
        search: (prev) => ({ ...prev, theme: undefined }),
        replace: true,
      }).catch(() => {
        pendingScheme.current = null
      })
    } else {
      setColorScheme(next)
    }
  }

  return (
    <ActionIcon
      visibleFrom="sm"
      size={'md'}
      variant="subtle"
      color="gray"
      onClick={toggle}
      aria-label="Toggle color scheme"
    >
      <IconMoonStars stroke={1.5} display={computedColorScheme === 'light' ? 'block' : 'none'} />
      <IconSun stroke={1.5} display={computedColorScheme === 'dark' ? 'block' : 'none'} />
    </ActionIcon>
  )
}
