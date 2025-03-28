import { css, sva } from '@likec4/styles/css'

export const iconSize = '--icon-size'

const title = css.raw({
  textStyle: 'likec4.node.primary',
  flex: '0 0 auto',
  textAlign: 'center',
  color: 'likec4.palette.hiContrast',
})

const description = css.raw({
  flex: '0 1 auto',
  textStyle: 'likec4.node.secondary',
  color: 'likec4.palette.loContrast',
  textAlign: 'center',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  _shapeSizeXs: {
    display: 'none',
  },
  _smallZoom: {
    display: 'none',
  },
})

const technology = css.raw({
  flex: '0 0 auto',
  textStyle: 'likec4.node.secondary',
  color: 'likec4.palette.loContrast',
  fontSize: `calc(var(--likec4-text-size) * 0.635)`,
  lineHeight: 1.125,
  textAlign: 'center',
  textWrap: 'balance',
  opacity: 0.92,
  _whenHovered: {
    opacity: 1,
  },
  _shapeSizeXs: {
    display: 'none',
  },
  _shapeSizeSm: {
    display: 'none',
  },
  _smallZoom: {
    display: 'none',
  },
})

const varIconSize = `var(${iconSize})`
export const elementIcon = css({
  flex: `0 0 ${varIconSize}`,
  height: varIconSize,
  width: varIconSize,
  display: 'flex',
  alignSelf: 'flex-start',
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
      ],
      _reduceGraphicsOnPan: 'none',
    },
  },
  [`& img`]: {
    objectFit: 'contain',
  },
})

export const elementTitle = sva({
  slots: ['root', 'textContainer', 'title', 'description', 'technology'],
  base: {
    root: {
      position: 'relative',
      flex: '1',
      height: 'fit-content',
      width: 'fit-content',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      paddingTop: 'var(--likec4-spacing)',
      paddingBottom: 'var(--likec4-spacing)',
      paddingLeft: 'calc(var(--likec4-spacing) + 8px)',
      paddingRight: 'calc(var(--likec4-spacing) + 8px)',
      overflow: 'hidden',
      pointerEvents: 'none',
      gap: '12px',
      _shapeQueue: {
        paddingLeft: '46px',
        paddingRight: '16px',
      },
      _shapeMobile: {
        paddingLeft: '46px',
        paddingRight: '16px',
      },
      _shapeCylinder: {
        paddingTop: '30px',
      },
      _shapeStorage: {
        paddingTop: '30px',
      },
      _shapeBrowser: {
        paddingTop: '32px',
        paddingBottom: '28px',
      },

      _shapeSizeXs: {
        [iconSize]: '24px',
      },
      _shapeSizeSm: {
        [iconSize]: '36px',
      },
      _shapeSizeMd: {
        [iconSize]: '60px',
      },
      _shapeSizeLg: {
        [iconSize]: '82px',
        gap: '16px',
      },
      _shapeSizeXl: {
        [iconSize]: '90px',
        gap: '16px',
      },
    },
    textContainer: {
      height: 'fit-content',
      width: 'fit-content',
      flex: '0 1 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'center',
      flexWrap: 'nowrap',
      overflow: 'hidden',
      gap: '8px',
    },
    title,
    description,
    technology,
  },
  variants: {
    hasIcon: {
      false: {},
      true: {
        root: {
          gap: '16px',
        },
        textContainer: {
          minWidth: `calc(50% + ${varIconSize})`,
          alignItems: 'flex-start',
        },
        title: {
          textAlign: 'left',
        },
        description: {
          textAlign: 'left',
        },
        technology: {
          textAlign: 'left',
        },
      },
    },
    hasDescription: {
      false: {},
      true: {},
    },
    hasTechnology: {
      false: {},
      true: {},
    },
  },
  compoundVariants: [
    {
      hasDescription: true,
      hasTechnology: true,
      css: {
        textContainer: {
          gap: '6px',
        },
      },
    },
  ],
  defaultVariants: {
    hasIcon: false,
  },
})
