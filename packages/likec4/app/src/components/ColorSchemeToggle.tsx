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
      <IconMoonStars stroke={1.5} display={computedColorScheme === 'light' ? 'block' : 'none'} />
      <IconSun stroke={1.5} display={computedColorScheme === 'dark' ? 'block' : 'none'} />
    </ActionIcon>
  )
}
