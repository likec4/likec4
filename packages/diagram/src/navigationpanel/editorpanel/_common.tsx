import {
  Tooltip as MantineTooltip,
} from '@mantine/core'

export const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 600,
  closeDelay: 120,
  label: '',
  children: null,
  offset: 8,
  position: 'right',
})
