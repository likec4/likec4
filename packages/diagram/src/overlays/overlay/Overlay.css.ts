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
})
