import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { transitions, vars } from '../../../theme-vars'

export const stokeFillMix = createVar('stroke-fill-mix')

export const container = style({
  // position: 'absolute',
  // top: 0,
  // left: 0,
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`,
  },
  // selectors: {
  //   ':where(.react-flow__node.selected) &': {
  //     willChange: 'transform',
  //   },
  // },
  // Catch pointer below the element
  ':after': {
    content: ' ',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: 16,
    background: 'transparent',
    pointerEvents: 'all',
  },
})

export const bottomButtonsContainer = style({
  zIndex: 100,
  position: 'absolute',
  left: 0,
  width: '100%',
  bottom: 2,
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 2,
  justifyContent: 'center',
  pointerEvents: 'none',
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      bottom: 4,
    },
  },
})

//   --group-gap: var(--mantine-spacing-md);
//   --group-align: center;
//   --group-justify: flex-start;
//   --group-wrap: wrap;
//   gap: 0px;
// }
// <style>
// .element_bottomButtonsContainer__14yllojn {
//   z-index: 100;
//   position: absolute;
//   left: 50%;
//   bottom: 2px;
//   transform: translate(-50%, 0%);
// }

// <style>
// .m_4081bf90 {
//   display: flex
// ;
//   flex-direction: row;
//   flex-wrap: var(--group-wrap, wrap);
//   justify-content: var(--group-justify, flex-start);
//   align-items: var(--group-align, center);
//   gap: var(--group-gap, var(--mantine-spacing-md));
// }
// globalStyle(`:where(.react-flow__node:hover) ${bottomButtonsContainer}`, {
//   transitionDelay: '20ms',
//   gap: 16
// })

export const bottomActions = style({
  position: 'absolute',
  // top: 'calc(100% - 24px)',
  top: '100%',
  // bottom: 0,
  // transform: 'translateY(0px) scale(1)',
  left: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 1,
  // // // scale: 1,
  // selectors: {
  //   [`:where([data-hovered='true']) &`]: {
  //     // bottom: -5,
  //     // scale: 1.2,
  //     gap: 8,
  //     // transform: 'scale(1.2)',
  //     // marginTop: 10,
  //   },
  // },
})

export const bottomButton = style({
  marginTop: 0,
  color: vars.element.loContrast,
  opacity: 0.75,
  transition: transitions.fast,
  'vars': {
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg-container-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 50%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`,
  },
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
  // scale: 1,
  // transform: 'scale(1)',
  selectors: {
    [`:where([data-hovered='true']) &`]: {
      opacity: 1,
      background: `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
      // vars: {
      //   '--ai-bg': `var(--ai-bg-hover)`,
      // },
      // scale: 1.4,
      // transform: 'scale(1.2)',
      // marginTop: 10,
    },
  },
})
globalStyle(`${bottomButton} > *`, {
  pointerEvents: 'none',
})
