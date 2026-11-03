import { css } from '@likec4/styles/css'

export const input = css({
  border: 'transparent',
  background: {
    base: 'transparent',
    _focusWithin: {
      base: `mantine.gray[4]/55 !important`,
      _dark: `mantine.dark[5]/55 !important`,
    },
    _groupHover: {
      base: 'mantine.gray[3]/35',
      _dark: 'mantine.dark[5]/35',
    },
  },
})

export const pickviewBackdrop = css({
  position: 'absolute',
  inset: '0',
  width: '100%',
  height: '100%',
  backgroundColor: '[rgb(34 34 34 / 0.7)]',
  zIndex: '[902]',
  backdropFilter: 'auto',
  backdropBlur: '10px',
  _light: {
    backgroundColor: '[rgb(255 255 255 / 0.6)]',
  },
})
export const pickview = css({
  position: 'absolute',
  top: '[2rem]',
  left: '[50%]',
  width: '100%',
  maxWidth: '[600px]',
  minWidth: '[200px]',
  transform: 'translateX(-50%)',
  zIndex: '[903]',
})

export const pickviewGroup = css({
  marginTop: '2',
  '& + &': {
    marginTop: '[32px]',
  },
})
