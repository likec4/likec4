import { style } from '@vanilla-extract/css'

export const modalContent = style({
  backgroundColor: 'transparent',
  width: '100%',
  height: '100%'
  // backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[7]}, transparent 50%)`,
  // backdropFilter: 'blur(2px)',
})

export const modalBody = style({
  backgroundColor: 'transparent',
  padding: 0,
  width: '100%',
  height: '100%'
  // backgroundColor: `color-mix(in srgb, var(--mantine-color-body), transparent 70%)`,
  // selectors: {
  //   [':where([data-mantine-color-scheme=light]) &']: {
  //     backgroundColor: 'rgb(255 255 255 / 35%)'
  //   },
  //   [':where([data-mantine-color-scheme=dark]) &']: {
  //     backgroundColor: 'rgb(1 1 1 / 25%)'
  //   }
  // }
})

export const cssDiagram = style({
  vars: {
    ['--likec4-background-color']: 'transparent'
  }
})

// export const modalHeader = style({
//   position: 'absolute',
//   top: '1rem',
//   left: '1rem'
// })

// export const modalCloseButtonBox = style({
//   position: 'absolute',
//   top: '1rem',
//   right: '1rem'
// })

export const modalCloseButton = style({
  position: 'absolute',
  zIndex: 1,
  top: '1rem',
  right: '1rem'
})
export const historyButtons = style({
  position: 'absolute',
  zIndex: 1,
  top: '1rem',
  left: '1rem'
})
