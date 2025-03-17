import { css } from '@likec4/styles/css'
import { xyvars } from '@likec4/styles/vars'
// import {
//   reactFlow,
// } from '../../../LikeC4Diagram.css'
// import {
//   vars,
//   whereDark,
//   whereLight,
//   whereNotReducedGraphics,
//   whereReducedGraphics,
//   whereSmallZoom,
//   xyvars,
// } from '../../../theme-vars'

// export const xyvars = {
//   edge: {
//     stroke: '--xy-edge-stroke',
//     strokeSelected: '--xy-edge-stroke-selected',
//     labelColor: '--xy-edge-label-color',
//     labelBgColor: '--xy-edge-label-background-color',
//     strokeWidth: '--xy-edge-stroke-width',
//   },
// } as const

const isSelected = '.react-flow__edge.selected'

export const edgeVars = css({
  // color: 'likec4.'
  [xyvars.edge.stroke.var]: '{colors.xyedge.stroke}',
  [xyvars.edge.strokeSelected.var]: '{colors.xyedge.stroke.selected}',
  [xyvars.edge.labelColor.var]: '{colors.xyedge.label}',
  [xyvars.edge.labelBgColor.var]: '{colors.xyedge.label.bg}',
  [xyvars.edge.strokeWidth.var]: '3',
  _whenSelected: {
    [xyvars.edge.stroke.var]: '{colors.xyedge.stroke.selected}',
  },
  '&:is([data-likec4-hovered=\'true\'],[data-edge-active=\'true\'])': {
    [xyvars.edge.stroke.var]: '{colors.xyedge.stroke.selected}',
    [xyvars.edge.strokeWidth.var]: '3',
  },
  // globalStyle(`${edgeVars}:is([data-likec4-hovered='true'],[data-edge-active='true'])`, {
  //   vars: {
  //     // [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
  //     [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
  //     [xyvars.edge.strokeWidth]: '3',
  //   },
  // })
  // _notReducedGraphics: {
  //   _light: {
  //     [xyvars.edge.labelColor.var]: `color-mix(in srgb, {colors.likec4.relation.label}, rgba(255 255 255 / 0.85) 40%)`,
  //     [xyvars.edge.labelBgColor.var]: `color-mix(in srgb, {colors.likec4.relation.label.bg}, transparent 40%)`,
  //   },
  //   _dark: {
  //     [xyvars.edge.labelBgColor.var]: `color-mix(in srgb, {colors.likec4.relation.label.bg}, transparent 50%)`,
  //   },
  // },
  // _whenSelected: {
  //   [xyvars.edge.stroke.var]: xyvars.edge.strokeSelected.ref,
  //   [xyvars.edge.strokeWidth.var]: '3',
  // },
  // vars: {
  //   [mixColor]: `black`,
  //   [xyvars.edge.stroke]: vars.relation.lineColor,
  //   [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
  //   [xyvars.edge.labelColor]: vars.relation.labelColor,
  //   [xyvars.edge.labelBgColor]: vars.relation.labelBgColor,
  //   [xyvars.edge.strokeWidth]: '3',
  // },
  // selectors: {
  //   [`${whereDark} &`]: {
  //     vars: {
  //       [mixColor]: `white`,
  //     },
  //   },
  //   [`${whereLight} ${whereNotReducedGraphics} &`]: {
  //     vars: {
  //       [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 40%)`,
  //       [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 40%)`,
  //     },
  //   },
  //   [`${whereDark} ${whereNotReducedGraphics} &`]: {
  //     vars: {
  //       [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`,
  //     },
  //   },
  // },
})

export const edgeContainer = css({
  _reducedGraphics: {
    transition: 'none',
  },
})

// globalStyle(`:where(${isSelected}) ${edgeVars}`, {
//   vars: {
//     [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
//     [xyvars.edge.strokeWidth]: '3',
//   },
// })

// globalStyle(`${edgeVars}:is([data-likec4-hovered='true'],[data-edge-active='true'])`, {
//   vars: {
//     // [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
//     [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
//     [xyvars.edge.strokeWidth]: '3',
//   },
// })

// globalStyle(`:where(${isSelected}) ${edgeVars}[data-likec4-hovered='true']`, {
//   vars: {
//     [xyvars.edge.strokeWidth]: '4',
//   },
// })

// globalStyle(`${reactFlow} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`, {
//   mixBlendMode: 'plus-lighter',
// })
// globalStyle(`${whereLight} ${reactFlow} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`, {
//   mixBlendMode: 'screen',
// })

export const edgePathBg = css({
  // strokeWidth: xyvars.edge.strokeWidth,
  strokeOpacity: 0.08,
  // transition: 'stroke-width 175ms ease-in-out',
  // transition: 'stroke-width 175ms ease-in-out, stroke-opacity 150ms ease-out',
  transitionProperty: 'stroke-width, stroke-opacity',
  transitionDuration: 'fast',
  transitionTimingFunction: 'ease-out',
  _smallZoom: {
    display: 'none',
  },
  _whenSelected: {
    strokeWidth: 10,
    strokeOpacity: 0.15,
  },
  _whenHovered: {
    strokeWidth: 10,
    strokeOpacity: 0.15,
  },
  // [`:where(${isSelected}, [data-edge-active='true'], [data-likec4-hovered='true']) &`]: {
  //   // strokeWidth: `calc(${xyvars.edge.strokeWidth.ref} + 8)`,
  //   strokeWidth: xyvars.edge.strokeWidth.ref,
  //   strokeOpacity: 0.6,
  // },
})

// To fix issue with marker not inheriting color from path - we need to create container
export const markerContext = css({
  fill: 'xyedge.stroke',
  stroke: 'xyedge.stroke',
})

// const strokeKeyframes = keyframes({
//   'from': {
//     strokeDashoffset: 18 * 2 + 10,
//   },
//   'to': {
//     strokeDashoffset: 10,
//   },
// })

export const cssEdgePath = css({
  animationDuration: '800ms',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'linear',
  animationFillMode: 'both',
  strokeDashoffset: 10,
  _notReducedGraphics: {
    transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
  },
  _whenHovered: {
    animationName: 'xyedgeAnimated',
    animationDelay: '450ms',
  },
  [`:where(${isSelected}, [data-edge-active='true'], [data-edge-animated='true']) &`]: {
    animationName: 'xyedgeAnimated',
    animationDelay: '0ms',
  },
  [`:where([data-edge-dir='back']) &`]: {
    animationDirection: 'reverse',
  },
  _whenDimmed: {
    animationPlayState: 'paused',
  },
  _smallZoom: {
    animationName: 'none',
  },
})

export const looseReduce = css({
  animationName: 'none',
})
