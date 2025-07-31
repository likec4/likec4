import { css } from '@likec4/styles/css'
import { Breadcrumbs as MantineBreadcrumbs, ThemeIcon } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'

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
