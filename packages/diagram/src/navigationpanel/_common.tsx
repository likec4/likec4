import { css, cx } from '@likec4/styles/css'
import {
  type NavigationPanelActionIconVariant,
  navigationPanelActionIcon,
} from '@likec4/styles/recipes'
import {
  type ActionIconProps,
  ActionIcon,
  Breadcrumbs as MantineBreadcrumbs,
  createPolymorphicComponent,
  ThemeIcon,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { forwardRef } from 'react'

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

export type PanelActionIconProps =
  & Partial<NavigationPanelActionIconVariant>
  & Omit<ActionIconProps, keyof NavigationPanelActionIconVariant>
// & ElementProps<'button'>

export const PanelActionIcon = createPolymorphicComponent<'button', PanelActionIconProps>(
  forwardRef<HTMLButtonElement, PanelActionIconProps>(({
    variant = 'default',
    className,
    ...others
  }, ref) => (
    <ActionIcon
      size="md"
      variant="transparent"
      radius="sm"
      {...others}
      className={cx(
        className,
        navigationPanelActionIcon({ variant }),
      )}
      ref={ref} />
  )),
)

// export const PanelActionIcon = forwardRef<HTMLButtonElement, PanelActionIconProps>(({
//   variant = 'default',
//   className,
//   ...props
// }, ref) => (
//   <ActionIcon
//     size="md"
//     variant="transparent"
//     radius="sm"
//     {...props}
//     className={cx(
//       className,
//       navigationPanelActionIcon({ variant }),
//     )}
//     ref={ref} />
// ))
