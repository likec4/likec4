import { css, sva } from '@likec4/styles/css'
// import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
// import { calc } from '@vanilla-extract/css-utils'
// import { easings, vars, whereLight, whereNotReducedGraphics } from '../../../theme-vars'

export const _compoundOpacity = '--_compound-opacity'
const compoundOpacity = `var(${_compoundOpacity})`
// const varCompoundOpacity = createVar('compound-opacity')

export const _borderTransparency = '--_compound-border-transparency'
const borderTransparency = `var(${_borderTransparency})`

export const _borderWidth = '--_border-width'
// const borderWidth = `var(${_borderWidth})`
const borderWidth = `3px`
export const _borderRadius = '--_border-radius'
const borderRadius = `var(${_borderRadius})`

export const container = css({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: '0',
  margin: '0',
  border: 'transparent',
  _before: {
    borderRadius: borderRadius,
    content: '" "',
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    border: 'transparent',
    background: 'likec4.element.fill',
    backgroundClip: 'padding-box',
  },
  ['--_compound-title-color']: '{colors.likec4.element.loContrast}',
  _notReducedGraphics: {
    boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
    _before: {
      transition: `all 200ms {easings.inOut}`,
    },
  },

  [`:where(.react-flow__node.dragging) &`]: {
    boxShadow: 'none',
  },

  '&[data-compound-transparent="true"]': {
    boxShadow: 'none !important',
    _before: {
      opacity: compoundOpacity,
      borderWidth: `calc(${borderWidth} - 1px)`,
    },
    _light: {
      ['--_compound-title-color']: '{colors.likec4.element.stroke}',
    },
  },
})

const _borderColor = '--_compound-border-color'
const borderColor = `var(${_borderColor}, {colors.likec4.element.stroke})`
export const compoundBorder = css({
  borderRadius: borderRadius,
  padding: '0',
  margin: '0',
  transition: `all 250ms {easings.inOut}`,
  cursor: 'default',
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  background: '[transparent]',
  borderStyle: 'dashed',
  borderWidth: borderWidth,
  borderColor: `[color-mix(in srgb , ${borderColor}, transparent var(${_borderTransparency}, 5%))]`,
  _compoundTransparent: {
    _dark: {
      [_borderColor]: `color-mix(in srgb, {colors.likec4.compound.title} 25%, {colors.likec4.element.stroke})`,
    },
  },
})

export const indicator = sva({
  slots: ['root', 'rect'],
  className: 'compound-indicator',
  base: {
    root: {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
      visibility: 'hidden',
      ':where(.react-flow__node.selected:not(:focus-visible)) &': {
        visibility: 'visible',
      },
    },
    rect: {
      stroke: `[color-mix(in srgb, {colors.likec4.element.stroke} 30%, {colors.likec4.element.loContrast})]`,
      strokeWidth: '3',
      fill: '[none]',
      animationStyle: 'indicator',
      _light: {
        stroke: `[color-mix(in srgb, {colors.likec4.element.stroke} 80%, {colors.likec4.mixColor})]`,
      },
      // ':where(.react-flow__node.selected:not(:focus-visible)) &': {
      //   strokeWidth: '6',
      // },
      // ':where(.react-flow__node:focus-within:not(.selected)) &': {
      //   strokeWidth: '3',
      // },
    },
  },
})
