import { css as style } from '@likec4/styles/css'

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
  _before: {
    content: '" "',
    position: 'absolute',
    top: 'calc(100% - 4px)',
    left: 0,
    width: '100%',
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
    _before: {
      display: 'none',
    },
  },

  [`:where(.react-flow__node.selectable:not(.dragging)) &`]: {
    cursor: 'pointer',
  },
})
