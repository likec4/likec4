import { css } from '@likec4/styles/css'
// import { xyvars } from '@likec4/styles/vars'

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
//     stroke: {
//       var: edgeStroke,
//       ref: 'var(--xy-edge-stroke)',
//     },
//     strokeSelected: {
//       var: edgeStrokeSelected,
//       ref: 'var(--xy-edge-stroke-selected)',
//     },
//     labelColor: {
//       var: '--xy-edge-label-color',
//       ref: 'var(--xy-edge-label-color)',
//     },
//     labelBgColor: {
//       var: labelBg,
//       ref: 'var(--xy-edge-label-background-color)',
//     },
//     strokeWidth: {
//       var: '--xy-edge-stroke-width',
//       ref: 'var(--xy-edge-stroke-width)',
//     },
//   },
//   // edge: cssVar.scope('xy-edge', [
//   //   'stroke',
//   //   ['strokeSelected', 'stroke-selected'],
//   //   ['labelColor', 'label-color'],
//   //   ['labelBgColor', 'label-background-color'],
//   //   ['strokeWidth', 'stroke-width'],
//   // ]),
// } as const

const isSelected = '.react-flow__edge.selected'

// stroke: {
//         DEFAULT: {
//           description: 'The stroke color of the XYEdge',
//           value: {
//             base: '{colors.likec4.relation.line}',
//             _whenHovered: '{colors.xyedge.stroke.selected}',
//             _whenSelected: '{colors.xyedge.stroke.selected}',
//           },
//         },
//         selected: {
//           value: {
//             base: 'color-mix(in srgb, {colors.likec4.relation.line}, {colors.likec4.mixColor} 35%)',
//             _dark: 'color-mix(in srgb, {colors.likec4.relation.line}, white 35%)',
//             _light: 'color-mix(in srgb, {colors.likec4.relation.line}, black 20%)',
//           },
//         },
//       },
const edgeStroke = '--xy-edge-stroke'
const edgeStrokeSelected = '--xy-edge-stroke-selected'
const labelColor = '--xy-edge-label-color'
const labelBg = '--xy-edge-label-background-color'

export const edgeVars = css({
  // ''
  // color: 'likec4.'
  [edgeStroke]: '{colors.likec4.relation.stroke}',
  [edgeStrokeSelected]: '{colors.likec4.relation.stroke.selected}',
  [labelColor]: '{colors.likec4.relation.label}',
  [labelBg]: '{colors.likec4.relation.label.bg}',
  ['--xy-edge-stroke-width']: '3',
  '&:is([data-likec4-hovered=\'true\'],[data-edge-active=\'true\'])': {
    [edgeStroke]: '{colors.likec4.relation.stroke.selected}',
    ['--xy-edge-stroke-width']: '3',
  },
  // _whenSelected: {
  //   [edgeStroke]: xyvars.edge.strokeSelected.ref,
  // },
  _light: {
    [labelColor]: `color-mix(in srgb, {colors.likec4.relation.label}, rgba(255 255 255 / 0.85) 40%)`,
    [labelBg]: `{colors.likec4.relation.label.bg/60}`,
  },
  _dark: {
    [labelBg]: `{colors.likec4.relation.label.bg/50}`,
  },
  // },
  // globalStyle(`${edgeVars}:is([data-likec4-hovered='true'],[data-edge-active='true'])`, {
  //   vars: {
  //     // [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
  //     [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
  //     [xyvars.edge.strokeWidth]: '3',
  //   },
  // })

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
  fill: `[var(${edgeStroke})]`,
  stroke: `[var(${edgeStroke})]`,
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

const aiBg = {
  var: '--ai-bg',
  ref: 'var(--ai-bg)',
} as const

export const actionBtn = css({
  // zIndex: 'calc(var(--layer-overlays, 1) + 1)',
  pointerEvents: 'all',
  // color: `xyedge.label`,
  cursor: 'pointer',
  opacity: 0.75,
  transition: 'fast',
  // backgroundColor: aiBg.ref,
  [aiBg.var]: 'var(--xy-edge-label-background-color)',
  '--ai-hover': `color-mix(in srgb , var(--xy-edge-label-background-color), {colors.likec4.mixColor} 10%)`,
  '--ai-size': `var(--ai-size-sm)`,
  '--ai-radius': `var(--mantine-radius-sm)`,
  _hover: {
    translateY: '1px',
    scale: 1.15,
  },
  _active: {
    translateY: '-1px',
    scale: '0.9',
  },
  _whenHovered: {
    opacity: 1,
  },
  '& .tabler-icon': {
    width: '80%',
    height: '80%',
    strokeWidth: '2',
  },
})
