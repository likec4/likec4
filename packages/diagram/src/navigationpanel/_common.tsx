import { css, cx } from '@likec4/styles/css'
import {
  type NavigationPanelActionIconVariant,
  navigationPanelActionIcon,
} from '@likec4/styles/recipes'
import {
  type ActionIconProps,
  ActionIcon,
  Breadcrumbs as MantineBreadcrumbs,
  ThemeIcon,
  Tooltip as MantineTooltip,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import type { HTMLMotionProps } from 'motion/react'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'

export const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 600,
  closeDelay: 120,
  label: '',
  children: null,
  offset: 8,
  withinPortal: false,
})

export const BreadcrumbsSeparator = () => (
  <ThemeIcon
    component={m.div}
    variant="transparent"
    size={16}
    className={css({
      display: {
        base: 'none',
        '@/md': 'flex',
      },
      color: {
        base: 'mantine.colors.gray[5]',
        _dark: 'mantine.colors.dark[3]',
      },
    })}>
    <IconChevronRight />
  </ThemeIcon>
)

export const Breadcrumbs = MantineBreadcrumbs.withProps({
  separator: <BreadcrumbsSeparator />,
  separatorMargin: 4,
})

export type PanelActionIconProps =
  & Partial<NavigationPanelActionIconVariant>
  & Omit<ActionIconProps, keyof NavigationPanelActionIconVariant>
  & Omit<HTMLMotionProps<'button'>, keyof NavigationPanelActionIconVariant>

export const PanelActionIcon = forwardRef<HTMLButtonElement, PanelActionIconProps>(({
  variant = 'default',
  className,
  disabled = false,
  type,
  ...others
}, ref) => (
  <ActionIcon
    size="md"
    variant="transparent"
    radius="sm"
    component={m.button}
    {...!disabled && {
      whileHover: {
        scale: 1.085,
      },
      whileTap: {
        scale: 1,
        translateY: 1,
      },
    }}
    disabled={disabled}
    {...others}
    className={cx(
      className,
      navigationPanelActionIcon({ variant, type }),
    )}
    ref={ref} />
))
