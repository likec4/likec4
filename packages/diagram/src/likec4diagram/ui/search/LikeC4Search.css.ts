import { css } from '@likec4/styles/css'
export { focusable } from './_shared.css'

export const backdrop = css({
  position: 'fixed',
  zIndex: 900,
  inset: '0px',
  backgroundColor: '[rgb(34 34 34 / 0.95)]',
  backdropFilter: 'auto',
  backdropBlur: '10px',
  _light: {
    backgroundColor: '[rgb(255 255 255 / 0.92 )]',
  },
})
export const root = css({
  containerName: 'likec4-search',
  containerType: 'size',
  position: 'fixed',
  zIndex: 901,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  gap: 'md',
  paddingTop: '32px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingBottom: 0,
})
export const input = css({
  border: 'transparent',
  background: 'transparent',
  _focusWithin: {
    background: `mantine.colors.gray[3]/55`,
    _dark: {
      background: `mantine.colors.dark[4]/55`,
    },
  },
})

export const pickviewBackdrop = css({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  backgroundColor: '[rgb(34 34 34 / 0.7)]',
  zIndex: 902,
  backdropFilter: 'auto',
  backdropBlur: '10px',
  _light: {
    backgroundColor: '[rgb(255 255 255 / 0.6)]',
  },
})
export const pickview = css({
  position: 'absolute',
  top: '2rem',
  left: '50%',
  width: '100%',
  maxWidth: '600px',
  minWidth: '200px',
  transform: 'translateX(-50%)',
  zIndex: 903,
})

export const pickviewGroup = css({
  marginTop: '8px',
  '& + &': {
    marginTop: '32px',
  },
})

// globalStyle(`${whereDark} ${pickview} ${button}`, {
//   borderColor: mantine.colors.dark[5],
//   backgroundColor: mantine.colors.dark[6],
// })
// globalStyle(`${whereDark} ${pickview} ${button}:hover`, {
//   ...buttonFocused,
//   backgroundColor: `color-mix(in srgb, ${buttonFocused.backgroundColor}, transparent 40%)`,
// })
// globalStyle(`${whereDark} ${pickview} ${button}:focus`, buttonFocused)

export const scrollArea = css({
  height: [
    '100%',
    '100cqh',
  ],
  '& .mantine-ScrollArea-viewport': {
    minHeight: '100%',
    '& > div': {
      minHeight: '100%',
      height: '100%',
    },
  },
})
