import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { IconMoonStars, IconSun } from '@tabler/icons-react'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  })
  const computedColorScheme = useComputedColorScheme('light')

  return (
    <ActionIcon
      visibleFrom="sm"
      size={'md'}
      variant="subtle"
      color="gray"
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ? <IconMoonStars stroke={1.5} /> : <IconSun stroke={1.5} />}
    </ActionIcon>
  )
}
