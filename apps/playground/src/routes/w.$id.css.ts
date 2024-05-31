import { createVar, style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'

const bg = createVar()
export const resize = style({
  cursor: 'ew-resize',
  userSelect: 'none',
  boxSizing: 'border-box',
  borderLeft: '0px solid transparent',
  width: 4,
  padding: '0 1px',
  height: '100%',
  transition: 'all 175ms ease-in-out',
  backgroundColor: mantine.colors.defaultBorder,
  backgroundClip: 'content-box',
  // position: 'relative',
  // vars: {
  //   [bg]: mantine.colors.defaultBorder
  // },

  // borderRadius: 4,
  // backgroundColor: mantine.colors.defaultBorder,
  // transition: 'background-color 120ms ease-out',
  // ':before': {
  //   position: 'absolute',
  //   content: ' ',
  //   top: 0,
  //   left: '50%',
  //   width: 2,
  //   height: '100%',
  //   transform: 'translateX(-50%)',
  //   backgroundColor: bg,
  //   transition: 'background-color 150ms ease-in-out',
  // },

  ':hover': {
    transform: 'scaleX(2)',
    backgroundColor: mantine.colors.primaryColors.filledHover
    // vars: {
    //   [bg]: mantine.colors.primaryColors.filledHover
    // },
  }
})
