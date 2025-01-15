import { ActionIcon as MantineActionIcon, Tooltip as MantineTooltip } from '@mantine/core'

export const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  position: 'right',
  openDelay: 600,
  closeDelay: 120,
  label: '',
  children: null,
  offset: 8,
})

export const ActionIcon = MantineActionIcon.withProps({
  classNames: {
    root: 'action-icon',
  },
  variant: 'default',
  color: 'gray',
})
