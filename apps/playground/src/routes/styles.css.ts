// import { createVar, globalStyle } from '@vanilla-extract/css'
import { css as style } from '$styled-system/css'

// const bg = createVar()

export const panel = style({})

export const resize = style({
  cursor: 'ew-resize',
  userSelect: 'none',
  boxSizing: 'border-box',
  borderLeft: '0px solid transparent',
  transition: 'all 175ms ease-in-out',
  backgroundColor: 'defaultBorder',
  backgroundClip: 'content-box',
  flex: '0 0 6px',
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

  _hover: {
    scaleX: 2,
    backgroundColor: 'primary.filledHover',
    // vars: {
    //   [bg]: mantine.colors.primaryColors.filledHover
    // },
  },
})

export const stateAlert = style({
  position: 'absolute',
  top: '0.75rem',
  left: '0.5rem',
  userSelect: 'none',
  '& .mantine-Notification-description': {
    whiteSpace: 'pre-line',
  },
})

// globalStyle(`${stateAlert} .mantine-Notification-description`, {
//   whiteSpace: 'pre-line',
// })
