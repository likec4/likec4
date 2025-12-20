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
  outline: 'none',
  ['&:is([data-separator="active"],[data-separator="hover"])']: {
    backgroundColor: 'mantine.colors.primary.filledHover',
  },
  _hover: {
    scaleX: 2.2,
    backgroundColor: 'mantine.colors.primary.filledHover',
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
