import { css, sva } from '@likec4/styles/css'

// export const _compoundOpacity = '--_compound-opacity'
// const compoundOpacity = `var(${_compoundOpacity})`
// // const varCompoundOpacity = createVar('compound-opacity')

// export const _borderTransparency = '--_compound-border-transparency'
// const borderTransparency = `var(${_borderTransparency})`

// export const _borderWidth =
// const borderWidth = `var(${_borderWidth})`
export const borderWidth = {
  var: '--_border-width',
  ref: 'var(--_border-width, 2px)',
} as const

export const borderRadius = {
  var: '--_border-radius',
  ref: 'var(--_border-radius, 4px)',
} as const

export const compoundOpacity = {
  var: '--_compound-opacity',
  ref: 'var(--_compound-opacity, 1)',
} as const

export const borderOpacityPercent = {
  var: '--_border-opacity-percent',
  ref: 'var(--_border-opacity-percent, 100%)',
} as const

const root = css.raw({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: '0',
  margin: '0',
  border: 'transparent',
  pointerEvents: 'none',
  _before: {
    borderRadius: borderRadius.ref,
    content: '" "',
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    border: 'transparent',
    background: 'var(--likec4-palette-fill)',
    backgroundClip: 'padding-box',
    transitionDelay: '.075ms',
  },
  _noReduceGraphics: {
    _before: {
      transition: `all {durations.slow} {easings.inOut}`,
    },
    '&[data-likec4-hovered=\'true\']': {
      _before: {
        transitionDelay: '.2s',
        transitionTimingFunction: 'in',
      },
    },
  },
  '&:is([data-compound-transparent])': {
    _before: {
      opacity: compoundOpacity.ref,
      borderWidth: `calc(${borderWidth.ref} - 1px)`,
    },
  },
})

const compoundBorder = css.raw({
  borderRadius: borderRadius.ref,
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
  background: 'transparent',
  borderStyle: 'dashed',
  borderWidth: `[${borderWidth.ref}]`,
  borderColor: `[color-mix(in srgb, var(--likec4-palette-stroke) ${borderOpacityPercent.ref}, transparent)]`,
})

const indicatorSvg = css.raw({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  overflow: 'visible',
  visibility: 'hidden',
  _whenFocused: {
    visibility: 'visible',
  },
  _whenSelected: {
    visibility: 'visible',
  },
  _whenPanning: {
    display: 'none',
  },
})

const indicatorRect = css.raw({
  stroke: `[color-mix(in srgb, var(--likec4-palette-stroke) 60%, var(--likec4-palette-hiContrast))]`,
  strokeWidth: '4',
  fill: '[none]',
  animationStyle: 'indicator',
  _light: {
    stroke: `[color-mix(in srgb, var(--likec4-palette-stroke) 80%, var(--likec4-palette-hiContrast))]`,
  },
})

export const compound = sva({
  slots: ['root', 'compoundBorder', 'indicatorSvg', 'indicatorRect'],
  className: 'compound-container',
  base: {
    root,
    compoundBorder,
    indicatorSvg,
    indicatorRect,
  },
  variants: {
    isTransparent: {
      false: {
        root: {
          _before: {
            boxShadow: {
              _noReduceGraphics: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
              _whenSelected: 'none',
              _whenPanning: 'none !important',
            },
          },
        },
      },
      true: {
        root: {},
      },
    },
  },
})
