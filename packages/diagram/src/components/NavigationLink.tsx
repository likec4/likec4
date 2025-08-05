import { cx } from '@likec4/styles/css'
import { navigationLink } from '@likec4/styles/recipes'
import { type NavLinkProps, NavLink } from '@mantine/core'
import { forwardRef } from 'react'
import { type ComponentPropsWithoutRef } from 'react'

export interface NavigationLinkProps
  extends Omit<NavLinkProps, 'classNames'>, Omit<ComponentPropsWithoutRef<'button'>, keyof NavLinkProps>
{
  truncateLabel?: boolean
}

export const NavigationLink = forwardRef<HTMLButtonElement, NavigationLinkProps>((
  { className, truncateLabel = true, ...others },
  ref,
) => (
  <NavLink
    {...others}
    component="button"
    classNames={navigationLink({
      truncateLabel,
    })}
    className={cx(
      'group',
      'mantine-active',
      className,
    )}
    ref={ref}
  />
))

NavigationLink.displayName = 'NavigationLink'
