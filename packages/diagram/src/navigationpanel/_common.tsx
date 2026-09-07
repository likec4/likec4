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
import { type ReactNode, forwardRef } from 'react'

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

export type PanelActionIconProps =
  & Partial<NavigationPanelActionIconVariant>
  & Omit<ActionIconProps, keyof NavigationPanelActionIconVariant>
  & Omit<HTMLMotionProps<'button'>, keyof NavigationPanelActionIconVariant>
  & {
    tooltip?: ReactNode
  }

const panelActionIconAnimation = {
  whileHover: {
    scale: 1.085,
  },
  whileTap: {
    scale: 1,
    translateY: 1,
  },
}

export const PanelActionIcon = forwardRef<HTMLButtonElement, PanelActionIconProps>(({
  variant = 'default',
  className,
  disabled = false,
  type,
  tooltip,
  ...others
}, ref) => {
  const content = (
    <ActionIcon
      size="md"
      variant="transparent"
      radius="sm"
      component={m.button}
      {...(!disabled ? panelActionIconAnimation : undefined)}
      disabled={disabled}
      {...others}
      className={cx(
        className,
        navigationPanelActionIcon({ variant, type }),
      )}
      ref={ref} />
  )

  if (tooltip) {
    return (
      <Tooltip label={tooltip}>
        {content}
      </Tooltip>
    )
  }

  return content
})
