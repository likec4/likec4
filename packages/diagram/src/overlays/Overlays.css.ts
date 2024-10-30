import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { mantine, vars, whereDark, xyvars } from '../theme-vars'

const mixColor = createVar('mix-color')
export const container = style({
  position: 'absolute',
  top: 0,
  left: 0,
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  border: '0 solid transparent',
  width: '100%',
  height: '100%',
  zIndex: 1000,
  isolation: 'isolate',
  WebkitBackdropFilter: 'blur(var(--backdrop-blur))',
  backdropFilter: 'blur(var(--backdrop-blur))',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent var(--backdrop-opacity))`,
  vars: {
    '--backdrop-blur': '3px',
    '--backdrop-opacity': '50%',
    [mixColor]: `black`,
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 50%)`,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 30%)`
  },
  selectors: {
    [`${whereDark} &`]: {
      vars: {
        [mixColor]: `white`,
        [xyvars.edge.labelColor]: vars.relation.labelColor,
        [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`
      }
    }
  }
})

globalStyle(`:where(${container}) .react-flow__attribution`, {
  display: 'none'
})
globalStyle(`:where(${container}) .react-flow__edge-text`, {
  fontSize: 14
})
globalStyle(`:where(${container}) .react-flow__node-compound`, {
  mixBlendMode: 'hard-light'
})

globalStyle(`${container} .react-flow__edges > svg`, {
  mixBlendMode: 'plus-lighter'
})
globalStyle(`:where([data-mantine-color-scheme="light"]) ${container} .react-flow__edges > svg`, {
  mixBlendMode: 'screen'
})

// const dialogFadeIn = keyframes({
//   '0%': {
//     opacity: 0,
//     display: 'none'
//   },
//   '100%': {
//     opacity: 1,
//     display: 'block'
//   }
// })

// const dialogFadeOut = keyframes({
//   '0%': {
//     opacity: 1,
//     transform: 'scale(1)',
//     display: 'block'
//   },
//   '100%': {
//     opacity: 0,
//     transform: 'scale(0.98)',
//     display: 'none'
//   }
// })

// const backdropRgb = createVar('backdrop-rgb')

// const dialogBackdropFadeIn = keyframes({
//   '0%': {
//     WebkitBackdropFilter: 'blur(1px)',
//     backdropFilter: 'blur(1px)',
//     backgroundColor: `rgb(${backdropRgb} / 30%)`
//   },
//   '100%': {
//     WebkitBackdropFilter: 'blur(8px)',
//     backdropFilter: 'blur(8px)',
//     backgroundColor: `rgb(${backdropRgb} / 85%)`
//   }
// })

// export const dialog = style({
//   top: 0,
//   left: 0,
//   padding: 0,
//   margin: 0,
//   boxSizing: 'border-box',
//   border: '0 solid transparent',
//   width: '100%',
//   maxWidth: '100dvw',
//   height: '100%',
//   maxHeight: '100dvh',
//   background: 'transparent',
//   animation: `${dialogFadeOut} 130ms cubic-bezier(0.50, 0, 1, 1)`,
//   transformOrigin: '50% 20%',
//   vars: {
//     [backdropRgb]: '255 255 255'
//   },
//   selectors: {
//     [`${whereDark} &`]: {
//       vars: {
//         [backdropRgb]: '36 36 36'
//       }
//     },
//     '&[open]': {
//       animation: `${dialogFadeIn} 200ms cubic-bezier(0, 0, 0.40, 1) forwards`
//     },
//     '&::backdrop': {
//       WebkitBackdropFilter: 'blur(1px)',
//       backdropFilter: 'blur(1px)',
//       backgroundColor: `rgb(${backdropRgb} / 30%)`
//     },
//     '&[open]::backdrop': {
//       animation: `${dialogBackdropFadeIn} 350ms cubic-bezier(0, 0, 0.40, 1) forwards`
//     }
//   }
// })
