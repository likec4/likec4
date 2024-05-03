import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../mantine.css'

export const headerHeight = createVar('header-height')
globalStyle(':root', {
  vars: {
    [headerHeight]: '50px'
  }
})

export const cssHeader = style({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: headerHeight,
  gap: 4,
  padding: 2,
  display: 'flex',
  flexWrap: 'nowrap',
  alignItems: 'stretch',
  paddingLeft: 60,
  paddingRight: 20,
  backgroundColor: mantine.colors.body,
  overflow: 'hidden'
  // border-bottom: rem(1px) solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4));
})

export const cssDiagramTitleBox = style({
  flex: '1 1 100%',
  width: '100%',
  overflow: 'hidden'
})
export const cssDiagramTitle = style({
  // display: 'flex',
  // alignItems: 'center'
  width: '100%',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  vars: {
    '--text-fz': mantine.fontSizes.sm
  },
  '@media': {
    [mantine.largerThan('sm')]: {
      vars: {
        '--text-fz': mantine.fontSizes.md
      }
    }
  }
})
