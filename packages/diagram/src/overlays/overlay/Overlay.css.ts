import { css } from '@likec4/styles/css'

export const backdropBlur = '--_blur'
export const backdropOpacity = '--_opacity'

const borderRadius = '--_border-radius'
export const dialog = css({
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
    width: '100vw',
    height: '100vh',
  },
  sm: {
    [borderRadius]: '6px',
    padding: '6px',
    inset: '1rem',
    width: 'calc(100vw - 2rem)',
    height: 'calc(100vh - 2rem)',
  },
  md: {
    inset: '2rem',
    width: 'calc(100vw - 4rem)',
    height: 'calc(100vh - 4rem)',
  },
  lg: {
    inset: '4rem',
    width: 'calc(100vw - 8rem)',
    height: 'calc(100vh - 8rem)',
  },
  xl: {
    [borderRadius]: '8px',
    padding: '8px',
    inset: '5rem',
    width: 'calc(100vw - 10rem)',
    height: 'calc(100vh - 10rem)',
  },
})

export const body = css({
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
