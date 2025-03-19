import { css } from '@likec4/styles/css'
// import { createGlobalTheme, globalStyle, style } from '@vanilla-extract/css'
// import { scale, toHex } from 'khroma'
// import {
//   mantine,
//   rootClassName,
//   vars,
//   whereDark,
//   whereNotReducedGraphics,
//   whereReducedGraphics,
//   xyvars,
// } from './theme-vars'

// export const reactFlowReducedGraphics = `${whereReducedGraphics} ${cssReactFlow}`
// export const reactFlow = `${whereNotReducedGraphics} ${cssReactFlow}`

// export const notInitialized = style({
//   opacity: 0,
// })
// globalStyle(`.react-flow.not-initialized`, {
//   opacity: 0,
// })
// })

// globalStyle(`.react-flow${cssReactFlow}${cssTransparentBg}`, {
//   backgroundColor: 'transparent !important',
//   vars: {
//     [vars.likec4.background.color]: 'transparent !important',
//     [xyvars.background.color]: 'transparent !important',
//   },
// })

// globalStyle(`:where(.react-flow${cssReactFlow}, ${cssTransparentBg}) .react-flow__attribution`, {
//   display: 'none',
// })

export const hiddenIfZoomTooSmall = css({
  _smallZoom: {
    visibility: 'hidden',
  },
})

export const hiddenIfReducedGraphics = css({
  _reducedGraphics: {
    visibility: 'hidden',
  },
})
