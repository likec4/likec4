import { navigationLink } from '@likec4/styles/recipes'
import { NavLink } from '@mantine/core'
import type { FunctionComponent } from 'react'

export const NavigationLink = NavLink.withProps({
  component: 'button',
  className: 'group',
  classNames: navigationLink({
    truncateLabel: true,
  }),
})
;(NavigationLink as FunctionComponent).displayName = 'NavigationLink'
