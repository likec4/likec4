import { css } from '@likec4/styles/css'
import { ActionIcon, Breadcrumbs as MantineBreadcrumbs, ThemeIcon } from '@mantine/core'
import { IconChevronRight, IconMenu2 } from '@tabler/icons-react'

export const BreadcrumbsSeparator = () => (
  <ThemeIcon variant="transparent" size={16}>
    <IconChevronRight
      // size={14}
      className={css({
        color: {
          base: 'mantine.colors.gray[5]',
          _dark: 'mantine.colors.dark[3]',
        },
      })} />
  </ThemeIcon>
)

export const Breadcrumbs = MantineBreadcrumbs.withProps({
  separator: <BreadcrumbsSeparator />,
  separatorMargin: 4,
})

export const RootActionIcon = ActionIcon.withProps({
  size: 'md',
  variant: 'subtle',
  radius: 'md',
  color: 'gray',
  children: <IconMenu2 style={{ width: '80%', height: '80%' }} />,
  className: css({
    color: {
      base: 'mantine.colors.dimmed',
      _hover: 'mantine.colors.text',
    },
  }),
  // mr: 'var(--spacing-2)',
  // className: css({
  //   '--burger-color': {
  //     base: '{colors.mantine.colors.dimmed}',
  //     _hover: '{colors.mantine.colors.text}',
  //   },
  // }),
})
