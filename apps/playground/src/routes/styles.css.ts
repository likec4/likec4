import { css } from '@likec4/styles/css'

// const bg = createVar()

export const panel = css({
  backgroundColor: 'mantine.colors.body',
})

export const resize = css({
  cursor: 'ew-resize',
  userSelect: 'none',
  boxSizing: 'border-box',
  borderLeft: '0px solid transparent',
  transition: 'all 175ms ease-in-out',
  backgroundColor: 'mantine.colors.defaultBorder',
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
    scaleX: 2.2,
    backgroundColor: 'mantine.colors.primary.filledHover',
    // color: token('colors.gray.6'),
    // color: mantine.colors.dimmed,
    // content: `' ${token.var('colors.gray.light')}'`,
    // content: `${token('colors.green.6')}`,
    // vars: {
    //   [bg]: mantine.colors.primaryColors.filledHover
    // },
  },
})

export const stateAlert = css({
  position: 'absolute',
  top: '[0.75rem]',
  left: '[0.5rem]',
  userSelect: 'none',
  '& .mantine-Notification-description': {
    whiteSpace: 'pre-line',
  },
})

// globalStyle(`${stateAlert} .mantine-Notification-description`, {
//   whiteSpace: 'pre-line',
// })
