import { defineParts, defineRecipe } from '@pandacss/dev'
import { __v, vars } from '../const'
import { alpha } from '../helpers'

const borderWidth = {
  var: '--_border-width',
  ref: 'var(--_border-width)',
} as const

const borderRadius = {
  var: '--_border-radius',
  ref: 'var(--_border-radius)',
} as const

const compoundTransparency = {
  var: '--_compound-transparency',
  ref: 'var(--_compound-transparency)',
} as const

const borderTransparency = {
  var: '--_border-transparency',
  ref: 'var(--_border-transparency)',
} as const

const indicatorSpacing = {
  var: '--_indicator-spacing',
  ref: 'var(--_indicator-spacing)',
} as const

const compoundColor = {
  var: '--_compound-color',
  ref: 'var(--_compound-color)',
} as const

const parts = defineParts({
  root: { selector: '&' },
  titleContainer: { selector: '& .likec4-compound-title-container' },
  title: { selector: '& .likec4-compound-title' },
  icon: { selector: '& .likec4-compound-icon' },
  navigationBtn: { selector: '& .likec4-compound-navigation' },
  detailsBtn: { selector: '& .likec4-compound-details' },
  actionBtn: { selector: '& .action-btn' },
})

const iconSize = '20px'

export const compoundNode = defineRecipe({
  className: 'likec4-compound-node',
  base: parts({
    root: {
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: '0',
      margin: '0',
      pointerEvents: 'none',
      backgroundClip: 'padding-box',
      borderStyle: 'solid',
      borderWidth: borderWidth.ref,
      borderRadius: borderRadius.ref,
      boxSizing: 'border-box',
      [vars.palette.outline]: {
        base: `oklch(from ${__v('palette.stroke')} calc(l - 0.15) c h)`,
        _dark: `oklch(from ${__v('palette.stroke')} calc(l + 0.2) c h)`,
      },
      [borderWidth.var]: '3px',
      [borderRadius.var]: '6px',
      [compoundTransparency.var]: '100%',
      [borderTransparency.var]: '100%',
      [indicatorSpacing.var]: `calc(${borderWidth.ref} + 1px)`,
      [compoundColor.var]: `oklch(from ${__v('palette.loContrast')} calc(l - 0.05) c h)`,
      [vars.icon.color]: compoundColor.ref,
      color: compoundColor.ref,

      _before: {
        position: 'absolute',
        content: '" "',
        top: `calc(-1px - ${indicatorSpacing.ref} - ${borderWidth.ref})`,
        left: `calc(-1px - ${indicatorSpacing.ref} - ${borderWidth.ref})`,
        width: `calc(100% + 2px + 2 * ${indicatorSpacing.ref} + 2 * ${borderWidth.ref})`,
        height: `calc(100% + 2px + 2 * ${indicatorSpacing.ref} + 2 * ${borderWidth.ref})`,
        borderStyle: 'solid',
        borderWidth: `calc(${borderWidth.ref} + 1px)`,
        borderRadius: `calc(${borderRadius.ref} + 4px)`,
        borderColor: __v('palette.outline'),
        pointerEvents: 'none',
        display: {
          base: 'none',
          _whenFocused: 'block',
          _whenSelected: 'block',
        },
        animationStyle: 'indicator',
        animationPlayState: {
          base: 'paused',
          _whenFocused: 'running',
          _whenSelected: 'running',
          _whenPanning: 'paused',
        },
      },
      [`&:has(.likec4-compound-navigation) .likec4-compound-title-container`]: {
        paddingLeft: '[24px]',
      },
    },
    titleContainer: {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5', // 6px
      left: '2.5',
      top: '0.5',
      right: '30px',
      width: 'auto',
      minHeight: '30px',
      // mixBlendMode: {
      //   base: 'screen',
      //   _dark: 'plus-lighter',
      // },
      [`:where(.react-flow__node.draggable) &`]: {
        pointerEvents: 'all',
        cursor: 'grab',
      },
    },
    title: {
      flex: '1',
      fontFamily: 'likec4.compound',
      fontWeight: 600,
      fontSize: '15px',
      textTransform: 'uppercase',
      letterSpacing: '0.25px',
      lineHeight: '1',
    },
    icon: {
      flex: `0 0 ${iconSize}`,
      height: `${iconSize}`,
      width: `${iconSize}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mixBlendMode: {
        base: 'hard-light',
        _reduceGraphicsOnPan: 'normal',
        _print: 'normal!',
      },
      [`& svg, & img`]: {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        pointerEvents: 'none',
        filter: {
          base: [
            'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
            'drop-shadow(0 1px 8px rgb(0 0 0 / 8%))',
            'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
          ].join('\n'),
          _reduceGraphicsOnPan: 'none',
        },
      },
      [`& img`]: {
        objectFit: 'contain',
      },
    },
    actionBtn: {
      '--actionbtn-color': compoundColor.ref,
      '--actionbtn-color-hovered': compoundColor.ref,
      '--actionbtn-color-hovered-btn': `oklch(from ${compoundColor.ref} calc(l + 0.2) c h)`,
      opacity: {
        base: 0.6,
        _whenHovered: 0.75,
        _whenSelected: 0.75,
        _hover: 1,
      },
      _noReduceGraphics: {
        transition: 'fast',
      },
      _print: {
        display: 'none',
      },
    },
    navigationBtn: {
      position: 'absolute',
      top: '1',
      left: '0.5',
      _smallZoom: {
        display: 'none',
      },
      _print: {
        display: 'none',
      },
    },
    detailsBtn: {
      position: 'absolute',
      top: '0.5',
      right: '0.5',
      _smallZoom: {
        display: 'none',
      },
      _print: {
        display: 'none',
      },
    },
  }),
  variants: {
    isTransparent: {
      false: parts({
        root: {
          boxShadow: {
            _noReduceGraphics: '0 4px 10px 0.5px rgb(0 0 0/10%) , 0 2px 2px -1px rgb(0 0 0/40%)',
            _whenSelected: 'none',
            _whenPanning: 'none !important',
          },
          backgroundColor: __v('palette.fill'),
          borderColor: __v('palette.stroke'),
        },
      }),
      true: parts({
        root: {
          backgroundColor: alpha(__v('palette.fill'), compoundTransparency.ref),
          borderColor: alpha(__v('palette.stroke'), borderTransparency.ref),
          // [compoundColor.var]: {
          //   base: __v('palette.loContrast'),
          //   _dark: __v('palette.loContrast'),
          // },
          // [vars.palette.outline]: {
          //   base: `oklch(from ${__v('palette.stroke')} calc(l * 0.85) c h / ${borderTransparency.ref})`,
          //   _dark: `oklch(from ${__v('palette.stroke')} calc(l * 1.2) c h / ${borderTransparency.ref})`,
          // },
        },
      }),
    },
    // When the compound node is too transparent, the text color should be inverted
    inverseColor: {
      true: parts({
        actionBtn: {
          _dark: {
            '--actionbtn-color-hovered-btn': __v('palette.loContrast'),
          },
          _light: {
            '--actionbtn-color': __v('palette.stroke'),
            '--actionbtn-color-hovered': __v('palette.stroke'),
            '--actionbtn-color-hovered-btn': __v('palette.hiContrast'),
            '--actionbtn-bg-hovered': alpha(__v('palette.fill'), 50),
            '--actionbtn-bg-hovered-btn': __v('palette.fill'),
          },
        },
      }),
      false: {},
    },
    borderStyle: {
      solid: parts({
        root: {
          borderStyle: 'solid',
        },
      }),
      dashed: parts({
        root: {
          borderStyle: 'dashed',
        },
      }),
      dotted: parts({
        root: {
          borderStyle: 'dotted',
        },
      }),
      none: parts({
        root: {
          // We still need to have a border for consistent internal coordinates
          // So we use a transparent border and extend background
          borderColor: 'transparent!',
          backgroundClip: 'border-box!',
          [indicatorSpacing.var]: `calc(${borderWidth.ref} * 2)`,
        },
      }),
    },
  },
  compoundVariants: [
    {
      isTransparent: true,
      inverseColor: false,
      css: parts({
        root: {
          [compoundColor.var]: {
            base: `oklch(from ${__v('palette.loContrast')} calc(l - 0.1) c h)`,
            _dark: `oklch(from ${__v('palette.loContrast')} calc(l - 0.1) c h)`,
          },
        },
        titleContainer: {
          _light: {
            mixBlendMode: 'plus-lighter',
          },
        },
      }),
    },
    {
      isTransparent: true,
      inverseColor: true,
      css: parts({
        root: {
          [compoundColor.var]: {
            base: `oklch(from ${__v('palette.stroke')} calc(l + 0.1) c h)`,
            _dark: `oklch(from ${__v('palette.loContrast')} calc(l - 0.1) c h)`,
          },
        },
        titleContainer: {
          _light: {
            mixBlendMode: 'multiply',
          },
        },
      }),
    },
  ],
  staticCss: [
    {
      isTransparent: ['*'],
      inverseColor: ['*'],
      borderStyle: ['*'],
    },
  ],
})
