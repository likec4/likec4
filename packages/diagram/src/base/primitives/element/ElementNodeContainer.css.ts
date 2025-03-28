import { css as style } from '@likec4/styles/css'
// import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
// import { easings, vars, whereReducedGraphics } from '../../../theme-vars'
// import { iconSize, paddingSize, textSize } from './vars.css'

export const container = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  _after: {
    content: '" "',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: '24px',
    background: '[transparent]',
    pointerEvents: 'all',
  },
  _focusVisible: {
    outline: 'none',
  },

  // _whenDimmed: {
  //   opacity: 0.25,
  //   transition: `opacity 400ms {easings.inOut}, filter 500ms {easings.inOut}`,
  //   transitionDelay: '50ms',
  //   grayscale: 0.85,
  //   blur: '2px',
  //   // filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
  // },
  // _whenDimmedImmediate: {
  //   opacity: 0.25,
  //   grayscale: 0.85,
  //   blur: '2px',
  //   // transition: `opacity 100ms ${easings.inOut}, filter 100ms ${easings.inOut}`,
  //   // filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
  // },
  _reduceGraphicsOnPan: {
    _after: {
      display: 'none',
    },
  },

  [`:where(.react-flow__node.selectable:not(.dragging)) &`]: {
    cursor: 'pointer',
  },
})

// const sizes = ['xs', 'sm', 'lg', 'xl'] as const
// sizes.forEach((size) => {
//   globalStyle(`${container}[data-likec4-text-size="${size}"]`, {
//     vars: {
//       [textSize]: rem(defaultTheme.textSizes[size]),
//     },
//   })

//   globalStyle(`${container}[data-likec4-padding="${size}"]`, {
//     vars: {
//       [paddingSize]: rem(defaultTheme.spacing[size]),
//     },
//   })
// })
