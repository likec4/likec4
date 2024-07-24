import { style } from '@vanilla-extract/css'

export const modalContent = style({
  backgroundColor: 'transparent',
  width: '100%',
  height: '100%'
})

export const modalBody = style({
  backgroundColor: 'transparent',
  padding: 0,
  width: '100%',
  height: '100%'
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

export const closeButton = style({
  position: 'absolute',
  zIndex: 1,
  top: '1rem',
  right: '1rem',
  vars: {
    ['--ai-size']: 'var(--ai-size-lg)'
  }
  // '@media': {
  //   '(min-width: 62em)': {
  //     vars: {
  //       ['--ai-size']: 'var(--ai-size-lg)'
  //     }
  //   }
  // }
})
