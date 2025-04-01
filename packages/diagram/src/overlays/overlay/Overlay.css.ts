import { css, sva } from '@likec4/styles/css'

export const backdropBlur = '--_blur'
export const backdropOpacity = '--_opacity'

export const level = '--_level'
const offset = '--_offset'
const inset = '--_inset'

const borderRadius = '--_border-radius'
const dialog = css.raw({
  boxSizing: 'border-box',
  margin: 0,
  position: 'fixed',
  width: 'auto',
  height: 'auto',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: `mantine.colors.defaultBorder/50`,
  shadow: 'xl',
  border: 'transparent',
  outline: 'none',
  borderRadius: `var(${borderRadius})`,
  [backdropBlur]: '0px',
  [level]: '0',
  [offset]: '0px',
  [inset]: 'calc((1 + var(--_level) * 0.75) * var(--_offset))',
  [backdropOpacity]: '0%',
  _backdrop: {
    cursor: 'zoom-out',
    backdropFilter: `blur(var(${backdropBlur}))`,
    backgroundColor: {
      _dark: `[rgb(34 34 34 / var(${backdropOpacity}))]`,
      _light: `[rgb(15 15 15/ var(${backdropOpacity}))]`,
    },
  },
  smDown: {
    [borderRadius]: '0px',
    border: 'none',
    inset: 0,
    padding: 0,
    // [offset]: '0px',
    // [inset]: '0px',
    width: '100vw',
    height: '100vh',
  },
  sm: {
    inset: '[var(--_inset) var(--_inset) var(--_offset) var(--_inset)]',
    width: 'calc(100vw - 2 * var(--_inset))',
    height: 'calc(100vh - var(--_offset) - var(--_inset))',
    [borderRadius]: '6px',
    padding: '6px',
    [offset]: '1rem',
  },
  md: {
    [offset]: '1rem',
  },
  lg: {
    [offset]: '2rem',
  },
  xl: {
    [offset]: '4rem',
  },
  //     inset: '[calc(2rem + var(--_level, 0) * 1rem), 2rem, 2rem, 2rem]',
  //     width: 'calc(100vw - 4rem)',
  //     height: 'calc(100vh - 4rem - var(--_level, 0) * 1rem)',
  //   },
  //   lg: {
  //     inset: '[calc(4rem + var(--_level, 0) * 1rem), 4rem, 4rem, 4rem]',
  //     width: 'calc(100vw - 8rem)',
  //     height: 'calc(100vh - 8rem)',
  //   },
  //   xl: {
  //     [borderRadius]: '8px',
  //     padding: '8px',
  //     inset: '[calc(5rem + var(--_level, 0) * 1rem), 5rem, 5rem, 5rem]',
  //     width: 'calc(100vw - 10rem)',
  //     height: 'calc(100vh - 10rem - var(--_level, 0) * 1rem)',
  //   },
})

const body = css.raw({
  position: 'relative',
  containerName: 'overlay-dialog',
  containerType: 'size',
  border: `0 solid transparent`,
  background: 'mantine.colors.body',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  sm: {
    borderRadius: `calc(var(${borderRadius}) - 2px)`,
  },
})

export const overlay = sva({
  slots: ['dialog', 'body'],
  base: {
    dialog: dialog,
    body: body,
  },
  variants: {
    level: {
      0: {
        dialog: {
          [level]: '0',
        },
      },
      1: {
        dialog: {
          [level]: '1',
        },
      },
      2: {
        dialog: {
          [level]: '2',
        },
      },
      3: {
        dialog: {
          [level]: '3',
        },
      },
    },
  },
})
