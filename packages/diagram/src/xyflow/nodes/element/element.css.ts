import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { mantine, vars } from '../../../theme-vars'

export const stokeFillMix = createVar('stroke-fill-mix')

export const container = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  },
  selectors: {
    ':where(.react-flow__node.selected) &': {
      willChange: 'transform'
    }
  },
  // Catch pointer below the element
  ':after': {
    content: ' ',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: 16,
    background: 'transparent',
    pointerEvents: 'all'
  }
})

export const handleCenter = style({
  top: '50%',
  left: '50%',
  visibility: 'hidden'
})

export const containerAnimated = style({
  willChange: 'transform'
})

const indicatorKeyframes = keyframes({
  'from': {
    strokeOpacity: 0.8
  },
  'to': {
    strokeOpacity: 0.5
  }
})

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke
)

const indicatorStroke = createVar('indicator-stroke')

export const indicator = style({
  stroke: indicatorStroke,
  fill: 'none',
  transformOrigin: 'center center',
  strokeWidth: 6,
  animationDuration: '1s',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  strokeOpacity: 0.8,
  visibility: 'hidden',
  vars: {
    [indicatorStroke]: vars.element.loContrast
  },
  selectors: {
    ':where(.react-flow__node.selected) &': {
      visibility: 'visible',
      animationName: fallbackVar(vars.safariAnimationHook, indicatorKeyframes)
    },
    [`:where(.react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      strokeWidth: 10,
      stroke: outlineColor,
      visibility: 'visible'
    },
    ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      strokeWidth: 10
    },
    [`:where([data-mantine-color-scheme='light']) &`]: {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.fill} 50%, #3c3c3c)`
      }
    }
  }
})

export const fillElementFill = style({
  fill: vars.element.fill
})

export const fillElementStroke = style({
  fill: vars.element.stroke
})

export const fillMixStroke = style({
  fill: fallbackVar(stokeFillMix, `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`)
})

export const hasIcon = style({})

const textAlign = createVar('text-align')
const iconSize = createVar('icon-size')

export const title = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: textAlign,
  fontWeight: 500,
  fontSize: 19,
  lineHeight: 1.15,
  textWrap: 'balance',
  color: vars.element.hiContrast,
  whiteSpaceCollapse: 'preserve-breaks'
})

export const description = style({
  flex: '0 1 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 1.2,
  textAlign: textAlign,
  textWrap: 'pretty',
  color: vars.element.loContrast,
  whiteSpaceCollapse: 'preserve-breaks',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  selectors: {
    [`:where(${hasIcon}) &`]: {
      textWrap: 'wrap'
    }
  }
})

export const technology = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 12,
  lineHeight: 1.125,
  textAlign: textAlign,
  textWrap: 'balance',
  opacity: 0.92,
  color: vars.element.loContrast,
  selectors: {
    [`${container}:hover &`]: {
      opacity: 1
    }
  }
})

export const elementDataContainer = style({
  flex: '1',
  height: 'fit-content',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  padding: rem(24),
  overflow: 'hidden',
  gap: rem(10),
  vars: {
    [iconSize]: '48px'
  },
  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="mobile"]) &': {
      paddingLeft: 40,
      paddingRight: 20
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      paddingTop: 30
    },
    ':where([data-likec4-shape="browser"]) &': {
      paddingTop: 32,
      paddingBottom: 28
    },
    // [`&:is(${hasIcon})`]: {
    //   paddingLeft: 40,
    //   paddingRight: 20
    // },
    [`${container}:not(:is([data-likec4-shape="queue"],[data-likec4-shape="mobile"])) &:is(${hasIcon})`]: {
      paddingLeft: 24,
      paddingRight: 18
    },
    [`&:has(${description}, ${technology})`]: {
      gap: rem(16),
      vars: {
        [iconSize]: '60px'
      }
    }
  }
})

export const elementTextData = style({
  height: 'fit-content',
  width: 'max-content',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  flexWrap: 'nowrap',
  overflow: 'hidden',
  gap: rem(8),
  'vars': {
    [textAlign]: 'center'
  },
  selectors: {
    [`&:has(${description}):has(${technology})`]: {
      gap: rem(6)
    },
    [`:where(${hasIcon}) &`]: {
      minWidth: 'calc(100% - 160px)',
      alignItems: 'flex-start',
      'vars': {
        [textAlign]: 'left'
      }
    }
  }
})

export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'hard-light',
  alignSelf: 'flex-start'
})
globalStyle(`${elementIcon} svg, ${elementIcon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
  filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 12%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 8%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))
  `
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain'
})

const filterShadow = createVar('filter-shadow')

export const shapeSvgMultiple = style({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'none',
  transformOrigin: '50% 50%',
  fill: vars.element.fill,
  stroke: 'none',
  zIndex: -1,
  transition: 'opacity 500ms ease-out',
  transform: 'translate(8px,10px)',
  opacity: 0.5,
  selectors: {
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      visibility: 'hidden'
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      transform: 'translate(8px,8px)'
    },
    ':where([data-likec4-shape="queue"]) &': {
      transform: 'translate(-10px,8px)'
    }
  }
})
export const shapeSvg = style({
  top: 0,
  left: 0,
  position: 'absolute',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  filter: filterShadow,
  transition: 'filter 300ms ease-out',
  transitionDelay: '0ms',
  zIndex: -1,
  vars: {
    [filterShadow]: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, ${vars.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `
  },
  selectors: {
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      vars: {
        [filterShadow]: `none`
      }
    }
  }
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
      bottom: 4
    }
  }
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
