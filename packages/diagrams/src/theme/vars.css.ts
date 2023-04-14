import { createTheme } from '@vanilla-extract/css'
import { modularScale } from 'polished'

export const [themeClass, vars] = createTheme({
  space: {
    base: '1rem'
  }
})

// const createScale = (ratio: number, base: number) => (steps: number) =>
//   `${modularScale(steps, base, ratio)}px`

// const spaceScale = createScale(1.4, 4)
// const fontSizeScale = createScale(1.3, 16)
// const lineHeightScale = createScale(1.25, 24)
// const borderRadiusScale = createScale(1.5, 4)

// export const vars = createGlobalTheme(':root', {
//   space: {
//     xxs: '0.25rem',
//     xs: '0.5rem',
//     sm: '0.75rem',
//     base: '1rem',
//     md: '1rem',
//     lg: '1.25rem',
//     xl: '2.25rem',
//   },
//   color: {
//     core10: '#F7F3F6',
//     core20: '#E6D3E4',
//     core30: '#AF78B4',
//     core40: '#A05EA6',
//     core50: '#934398',
//     core60: '#7F187F',
//     core70: '#691568',
//     core80: '#480D4A',
//     black10: '#F5F5F5',
//     black20: '#D1D1D6',
//     black30: '#93939A',
//     black40: '#777279',
//     black50: '#646266',
//     black60: '#4D4A4F',
//     black70: '#363438',
//     black80: '#211E22',
//   },
//   borderRadius: {
//     '0x': borderRadiusScale(0),
//     '1x': borderRadiusScale(1),
//     '2x': borderRadiusScale(2),
//     '3x': borderRadiusScale(3),
//     '4x': borderRadiusScale(4),
//     '5x': borderRadiusScale(5),
//     full: '99999px',
//   },
//   fontFamily: {
//     body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
//   },
//   fontSize: {
//     xs: '0.75rem',
//     sm: '0.875rem',
//     md: '1rem',
//     base: '1rem',
//     lg: '1.125rem',
//     xl: '1.25rem',
//     '2xl': '1.5rem',
//     '3xl': '1.875rem',
//     '4xl': '2.25rem',
//     '5xl': '3rem',
//   },
//   lineHeight: {
//     normal: 'normal',
//     none: '1',
//     shorter: '1.25',
//     short: '1.375',
//     base: '1.5',
//     tall: '1.625',
//     taller: '2',
//   },
// })
