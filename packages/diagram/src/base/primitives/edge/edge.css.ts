import { css } from '@likec4/styles/css'

const isSelected = '.react-flow__edge.selected'

const edgeStroke = '--xy-edge-stroke'
const edgeStrokeSelected = '--xy-edge-stroke-selected'
const labelColor = '--xy-edge-label-color'
const labelBg = '--xy-edge-label-background-color'

export const edgeVars = css({
  [edgeStroke]: '{colors.likec4.relation.stroke}',
  [edgeStrokeSelected]: '{colors.likec4.relation.stroke.selected}',
  [labelColor]: {
    base: '{colors.likec4.relation.label}',
    _light: `color-mix(in srgb, {colors.likec4.relation.label}, rgba(255 255 255 / 0.85) 40%)`,
  },
  [labelBg]: {
    _light: `{colors.likec4.relation.label.bg/60}`,
    _dark: `{colors.likec4.relation.label.bg/50}`,
  },
  ['--xy-edge-stroke-width']: '3',
  '&:is([data-likec4-hovered=\'true\'],[data-edge-active=\'true\'])': {
    [edgeStroke]: '{colors.likec4.relation.stroke.selected}',
    _whenSelected: {
      ['--xy-edge-stroke-width']: '4',
    },
  },
})

export const edgeContainer = css({
  _reduceGraphics: {
    transition: 'none',
  },
})

const _hideOnReducedGraphics = css.raw({
  _reduceGraphicsOnPan: {
    display: 'none',
  },
  _smallZoom: {
    display: 'none',
  },
})
export const hideOnReducedGraphics = css(_hideOnReducedGraphics)

export const edgePathBg = css(_hideOnReducedGraphics, {
  fill: '[none]',
  strokeWidth: 'calc(var(--xy-edge-stroke-width) + 2)',
  strokeOpacity: 0.08,
  transitionProperty: 'stroke-width, stroke-opacity',
  transitionDuration: 'fast',
  transitionTimingFunction: 'inOut',
  _whenHovered: {
    transitionTimingFunction: 'out',
    strokeWidth: 'calc(var(--xy-edge-stroke-width) + 4)',
    strokeOpacity: 0.2,
  },
  _whenSelected: {
    strokeWidth: 'calc(var(--xy-edge-stroke-width) + 6)',
    strokeOpacity: 0.25,
    _whenHovered: {
      strokeOpacity: 0.4,
    },
  },
})

// To fix issue with marker not inheriting color from path - we need to create container
export const markerContext = css({
  fill: '[var(--xy-edge-stroke)]' as const,
  stroke: '[var(--xy-edge-stroke)]' as const,
})

export const cssEdgePath = css({
  fill: '[none!]',
  strokeDashoffset: 10,
  _noReduceGraphics: {
    transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
  },
  _whenHovered: {
    animationStyle: 'xyedgeAnimated',
    animationDelay: '450ms',
  },
  [`:where(${isSelected}, [data-edge-active='true'], [data-edge-animated='true']) &`]: {
    animationStyle: 'xyedgeAnimated',
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
  _whenPanning: {
    strokeDasharray: 'none !important',
    animationName: 'none',
  },
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
