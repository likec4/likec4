import { defineParts, defineRecipe } from '@pandacss/dev'

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
      ['--likec4-palette-outline']: {
        _light: 'color-mix(in srgb, var(--likec4-palette-stroke) 70%, var(--likec4-palette-hiContrast))',
        _dark: 'color-mix(in srgb, var(--likec4-palette-stroke) 40%, var(--likec4-palette-loContrast))',
      },
      [borderWidth.var]: '3px',
      [borderRadius.var]: '{radii.md}',
      [compoundTransparency.var]: '100%',
      [borderTransparency.var]: '100%',
      [indicatorSpacing.var]: `calc(${borderWidth.ref} + 2px)`,
      [compoundColor.var]: 'var(--likec4-palette-loContrast)',
      color: compoundColor.ref,

      _after: {
        position: 'absolute',
        content: '" "',
        top: `[calc(-1 * ${indicatorSpacing.ref})]`,
        left: `[calc(-1 * ${indicatorSpacing.ref})]`,
        width: `[calc(100% + 2 * ${indicatorSpacing.ref})]`,
        height: `[calc(100% + 2 * ${indicatorSpacing.ref})]`,
        borderStyle: 'solid',
        borderWidth: borderWidth.ref,
        borderRadius: `calc(${borderRadius.ref} + 2px)`,
        borderColor: 'var(--likec4-palette-outline)',
        pointerEvents: 'none',
        display: 'none',
      },
      _whenFocused: {
        _after: {
          display: 'block',
          animationStyle: 'indicatorOpacity',
        },
      },
      _whenSelected: {
        _after: {
          display: 'block',
          animationStyle: 'indicatorOpacity',
        },
        [`& .action-btn`]: {
          opacity: 0.75,
        },
      },
      _whenPanning: {
        _after: {
          animationPlayState: 'paused',
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
      right: '[30px]',
      width: 'auto',
      minHeight: '30px',
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
      color: compoundColor.ref,
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
      '--actionbtn-color-hovered-btn': `color-mix(in srgb, ${compoundColor.ref} 80%, #fff)`,
      opacity: {
        base: 0.6,
        _whenHovered: 0.75,
        _hover: 1,
      },
      _noReduceGraphics: {
        transition: 'fast',
      },
    },
    navigationBtn: {
      position: 'absolute',
      top: '0.5',
      left: '0.5',
      _smallZoom: {
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
          backgroundColor: 'var(--likec4-palette-fill)',
          borderColor: 'var(--likec4-palette-stroke)',
        },
      }),
      true: parts({
        root: {
          backgroundColor: `[color-mix(in srgb, var(--likec4-palette-fill) ${compoundTransparency.ref}, transparent)]`,
          borderColor: `[color-mix(in srgb, var(--likec4-palette-stroke) ${borderTransparency.ref}, transparent)]`,
        },
      }),
    },
    // When the compound node is too transparent, the text color should be inverted
    inverseColor: {
      true: parts({
        root: {
          [compoundColor.var]: {
            base: 'var(--likec4-palette-stroke)',
            _dark: '[color-mix(in srgb, var(--likec4-palette-loContrast) 60%, var(--likec4-palette-fill))]',
          },
        },
        actionBtn: {
          _dark: {
            '--actionbtn-color-hovered-btn': 'var(--likec4-palette-loContrast)',
          },
          _light: {
            '--actionbtn-color': 'var(--likec4-palette-stroke)',
            '--actionbtn-color-hovered': 'var(--likec4-palette-stroke)',
            '--actionbtn-color-hovered-btn': 'var(--likec4-palette-hiContrast)',
            '--actionbtn-bg-hovered': `var(--likec4-palette-fill)/50`,
            '--actionbtn-bg-hovered-btn': `var(--likec4-palette-fill)`,
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
          _after: {
            borderWidth: `calc(${borderWidth.ref} + 1px)`,
            borderRadius: `calc(${borderRadius.ref} + 2px)`,
          },
        },
      }),
    },
  },
  staticCss: [
    {
      isTransparent: ['*'],
      inverseColor: ['*'],
      borderStyle: ['*'],
    },
  ],
})
