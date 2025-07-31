import { navBtn } from '@likec4/styles/recipes'
import { NavLink } from '@mantine/core'
import type { FunctionComponent } from 'react'

const classNames = navBtn({
  truncateLabel: true,
})

export const NavBtn = NavLink.withProps({
  component: 'button',
  className: 'group',
  classNames,
})
;(NavBtn as FunctionComponent).displayName = 'NavBtn'
