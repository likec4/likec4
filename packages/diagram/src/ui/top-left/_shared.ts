import { ActionIcon as MantineActionIcon, Tooltip as MantineTooltip } from '@mantine/core'

export const Tooltip = MantineTooltip.withProps({
  color: 'gray',
  fz: 'xs',
  position: 'right',
  openDelay: 400,
  closeDelay: 100,
  label: '',
  children: null,
  offset: 8,
  transitionProps: { transition: 'fade-right', duration: 200 }
})

export const ActionIcon = MantineActionIcon.withProps({
  className: 'action-icon',
  variant: 'light',
  color: 'gray'
})
