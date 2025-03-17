import { css } from '@likec4/styles/css'

export const backdropBlur = '--_blur'
export const backdropOpacity = '--_opacity'
const backdropColor = '--backdrop-color'

const borderRadius = '--border-radius'
export const dialog = css({
  boxSizing: 'border-box',
  margin: 0,
  position: 'fixed',
  inset: '5rem 4rem 4rem 4rem',
  width: 'auto',
  height: 'auto',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: `mantine.colors.defaultBorder/50`,
  shadow: 'xl',
  border: `0 solid transparent`,
  outline: 'none',
  borderRadius: `var(${borderRadius}, 8px)`,
  padding: '6px',
  // [borderRadius]: '8px',
  // [backdropColor]: '34 34 34',
  // [backdropOpacity]: '0%',
  // [backdropBlur]: '0px',
  _backdrop: {
    cursor: 'zoom-out',
    backdropFilter: 'auto',
    backdropBlur: `var(${backdropBlur}, 0px)`,
    backgroundColor: `[rgb(34 34 34 / var(${backdropOpacity}, 0%))]`,
  },
  _light: {
    backgroundColor: `[rgb(15 15 15/ var(${backdropOpacity}, 0%))]`,
  },
  mdDown: {
    borderRadius: 'sm',
    inset: '2rem',
    width: 'calc(100vw - 4rem)',
    height: 'calc(100vh - 4rem)',
  },
  smDown: {
    border: 'none',
    inset: 0,
    width: '100vw',
    height: '100vh',
  },
})

export const body = css({
  position: 'relative',
  containerName: 'overlay-dialog',
  containerType: 'size',
  border: `0 solid transparent`,
  borderRadius: `calc(var(${borderRadius}) - 2px)`,
  backgroundColor: 'mantine.colors.body',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
})
