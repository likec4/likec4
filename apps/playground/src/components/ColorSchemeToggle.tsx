import { css } from '@likec4/styles/css'
import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { IconMoonStars, IconSun } from '@tabler/icons-react'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  return (
    <ActionIcon
      className={css({
        width: '18px',
        height: '18px',
      })}
      visibleFrom="lg"
      size={'md'}
      variant="subtle"
      color="gray"
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light'
        ? <IconMoonStars stroke={1.5} />
        : <IconSun stroke={1.5} />}
    </ActionIcon>
  )
}
