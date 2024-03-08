import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../theme'

export const headerHeight = createVar('stroke-fill-mix')
globalStyle(':root', {
  vars: {
    [headerHeight]: '50px'
  }
})

export const header = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: headerHeight,
  gap: 4,
  padding: 2,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  paddingLeft: 40,
  paddingRight: 20,
  backgroundColor: mantine.colors.body
  // border-bottom: rem(1px) solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4));
})
