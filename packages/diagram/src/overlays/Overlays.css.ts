import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, vars, whereDark, whereLight, xyvars } from '../theme-vars'

export const ZIndexes = {
  overlay: 100,
  container: 105,
  elementDetails: 120
}

export const overlayBackdrop = style({
  position: 'fixed',
  inset: 0,
  WebkitBackdropFilter: 'blur(var(--backdrop-blur))',
  backdropFilter: 'blur(var(--backdrop-blur))',
  backgroundColor: `rgb(36 36 36 / 50%)`,
  zIndex: ZIndexes.overlay,
  pointerEvents: 'all',
  cursor: 'pointer',
  vars: {
    '--backdrop-blur': '0px'
  }
})

export const mixColor = createVar('mix-color')
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
    [mixColor]: `black`
  },
  selectors: {
    [`${whereDark} &`]: {
      vars: {
        [mixColor]: `white`
      }
    }
  }
})

export const cssReactflowMarker = style({})
globalStyle(`.react-flow${cssReactflowMarker}`, {
  vars: {
    // [xyvars.background.color]: vars.likec4.background.color,
    [xyvars.background.pattern.color]: vars.likec4.background.pattern.color
  }
})

globalStyle(`${whereDark} .react-flow${cssReactflowMarker}`, {
  vars: {
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`
  }
})
globalStyle(`:where(${cssReactflowMarker}) .react-flow__attribution`, {
  display: 'none'
})
globalStyle(`:where(${cssReactflowMarker}) .react-flow__edge-text`, {
  fontSize: 16
})
globalStyle(`${cssReactflowMarker} .react-flow__edges > svg`, {
  mixBlendMode: 'plus-lighter'
})
globalStyle(`${whereLight} ${cssReactflowMarker} .react-flow__edges > svg`, {
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
